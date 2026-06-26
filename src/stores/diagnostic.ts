import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { diagnosticTests, diagnosticTestMap } from '../data/diagnosticTests'
import { clearAllSessionMedia, clearSessionMedia } from '../lib/sessionMedia'
import type {
  DiagnosticGuidedState,
  DiagnosticGuidedUserVerdict,
  DiagnosticSession,
  DiagnosticSessionStep,
  DiagnosticTestDefinition,
  DiagnosticTestRunResult
} from '../domain/diagnostic'

const STORAGE_KEY = 'phone-tester.active-session'

const isBrowser = () => typeof window !== 'undefined'

const buildFallbackUuid = () => {
  const timestamp = Date.now().toString(36)
  const randomChunk = Math.random().toString(36).slice(2, 10)

  return `session-${timestamp}-${randomChunk}`
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return buildFallbackUuid()
}

const buildGuidedState = (test: DiagnosticTestDefinition) => test.createGuidedState?.() ?? null

const buildSteps = (): DiagnosticSessionStep[] =>
  diagnosticTests.map((test) => ({
    testId: test.id,
    status: 'pending',
    result: null,
    guidedState: test.mode === 'guided' ? buildGuidedState(test) : null
  }))

const buildSession = (): DiagnosticSession => ({
  id: generateSessionId(),
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deviceTarget: 'iphone-safari',
  steps: buildSteps()
})

export const useDiagnosticStore = defineStore('diagnostic', () => {
  const activeSession = ref<DiagnosticSession | null>(null)
  const hydrated = ref(false)

  const persist = () => {
    if (!isBrowser()) {
      return
    }

    if (!activeSession.value) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Some Safari contexts can block storage access; keep in-memory session only.
      }
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession.value))
    } catch {
      // Keep the active session in memory when localStorage is unavailable or quota-limited.
    }
  }

  const hydrateFromStorage = () => {
    if (hydrated.value || !isBrowser()) {
      hydrated.value = true
      return
    }

    let rawSession: string | null = null

    try {
      rawSession = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      hydrated.value = true
      return
    }

    if (rawSession) {
      activeSession.value = JSON.parse(rawSession) as DiagnosticSession
    }

    hydrated.value = true
  }

  watch(activeSession, persist, { deep: true })

  const ensureHydrated = () => {
    hydrateFromStorage()
  }

  const testDefinitions = computed<DiagnosticTestDefinition[]>(() => diagnosticTests)

  const sessionProgress = computed(() => {
    if (!activeSession.value) {
      return 0
    }

    const completedSteps = activeSession.value.steps.filter((step) => step.result !== null).length
    return Math.round((completedSteps / activeSession.value.steps.length) * 100)
  })

  const currentScore = computed(() => {
    if (!activeSession.value) {
      return 0
    }

    const scoredSteps = activeSession.value.steps.filter((step) => step.result)

    if (scoredSteps.length === 0) {
      return 0
    }

    const points = scoredSteps.reduce((total, step) => {
      const status = step.result?.status

      if (status === 'pass') {
        return total + 1
      }

      if (status === 'warning' || status === 'pending') {
        return total + 0.5
      }

      return total
    }, 0)

    return Math.round((points / scoredSteps.length) * 100)
  })

  const startSession = () => {
    const session = buildSession()
    activeSession.value = session
    persist()
    return session
  }

  const getSessionById = (sessionId: string) => {
    if (activeSession.value?.id === sessionId) {
      return activeSession.value
    }

    return null
  }

  const resumeSession = () => {
    ensureHydrated()
    return activeSession.value
  }

  const getTestDefinition = (testId: string) => diagnosticTestMap[testId] ?? null

  const getStepByTestId = (sessionId: string, testId: string) => {
    const session = getSessionById(sessionId)
    return session?.steps.find((step) => step.testId === testId) ?? null
  }

  const getNextStep = (sessionId: string, testId: string) => {
    const session = getSessionById(sessionId)

    if (!session) {
      return null
    }

    const currentIndex = session.steps.findIndex((step) => step.testId === testId)

    if (currentIndex === -1) {
      return session.steps[0] ?? null
    }

    return session.steps[currentIndex + 1] ?? null
  }

  const getFirstIncompleteStep = (sessionId: string) => {
    const session = getSessionById(sessionId)
    return session?.steps.find((step) => step.result === null) ?? null
  }

  const getCurrentGuidedSubStep = (sessionId: string, testId: string) => {
    const guidedState = getStepByTestId(sessionId, testId)?.guidedState

    if (!guidedState) {
      return null
    }

    return guidedState.steps[guidedState.currentStepIndex] ?? null
  }

  const updateSessionMeta = (session: DiagnosticSession) => {
    session.updatedAt = new Date().toISOString()
    session.status = session.steps.every((entry) => entry.result !== null) ? 'completed' : 'draft'
  }

  const markResult = (session: DiagnosticSession, stepId: string, result: DiagnosticTestRunResult) => {
    const step = session.steps.find((entry) => entry.testId === stepId)

    if (!step) {
      return
    }

    step.status = 'completed'
    step.result = result

    if (step.guidedState) {
      step.guidedState.phase = 'completed'
    }

    updateSessionMeta(session)
  }

  const runTest = async (sessionId: string, testId: string) => {
    const session = getSessionById(sessionId)
    const definition = getTestDefinition(testId)

    if (!session || !definition?.run) {
      return null
    }

    const step = session.steps.find((entry) => entry.testId === testId)

    if (!step) {
      return null
    }

    step.status = 'running'
    updateSessionMeta(session)

    const result = await definition.run()
    markResult(session, testId, result)
    persist()

    return result
  }

  const getGuidedContext = (sessionId: string, testId: string) => {
    const session = getSessionById(sessionId)
    const definition = getTestDefinition(testId)
    const step = getStepByTestId(sessionId, testId)

    if (!session || !definition || !step?.guidedState || definition.mode !== 'guided') {
      return null
    }

    return {
      session,
      definition,
      step,
      guidedState: step.guidedState
    }
  }

  const startGuidedTest = (sessionId: string, testId: string) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    context.step.status = 'running'
    context.guidedState.phase = 'active'
    context.guidedState.startedAt = context.guidedState.startedAt ?? new Date().toISOString()

    context.guidedState.steps = context.guidedState.steps.map((entry, index) => ({
      ...entry,
      status: index === context.guidedState.currentStepIndex ? 'active' : entry.response ? 'completed' : 'pending'
    }))

    updateSessionMeta(context.session)
    persist()
  }

  const recordGuidedStepResponse = (sessionId: string, testId: string, response: 'yes' | 'no') => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    const currentStep = context.guidedState.steps[context.guidedState.currentStepIndex]

    if (!currentStep) {
      return
    }

    currentStep.response = response
    currentStep.status = 'completed'

    const nextStep = context.guidedState.steps[context.guidedState.currentStepIndex + 1]

    if (nextStep) {
      nextStep.status = 'active'
      context.guidedState.currentStepIndex += 1
      context.guidedState.phase = 'active'
    } else {
      context.guidedState.phase = 'confirm'
    }

    updateSessionMeta(context.session)
    persist()
  }

  const completeGuidedStep = (sessionId: string, testId: string) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    const currentStep = context.guidedState.steps[context.guidedState.currentStepIndex]

    if (!currentStep) {
      return
    }

    currentStep.status = 'completed'

    const nextStep = context.guidedState.steps[context.guidedState.currentStepIndex + 1]

    if (nextStep) {
      nextStep.status = 'active'
      context.guidedState.currentStepIndex += 1
      context.guidedState.phase = 'active'
    } else {
      context.guidedState.phase = 'confirm'
    }

    updateSessionMeta(context.session)
    persist()
  }

  const updateGuidedMetrics = (
    sessionId: string,
    testId: string,
    metrics: Record<string, string | number | boolean | null | string[]>,
    options?: {
      persist?: boolean
    }
  ) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    context.step.status = 'running'
    context.guidedState.phase = 'active'
    context.guidedState.startedAt = context.guidedState.startedAt ?? new Date().toISOString()
    context.guidedState.metrics = {
      ...context.guidedState.metrics,
      ...metrics
    }

    if (context.guidedState.steps[0]) {
      context.guidedState.steps[0].status = 'active'
    }

    updateSessionMeta(context.session)

    if (options?.persist !== false) {
      persist()
    }
  }

  const moveGuidedTestToConfirm = (sessionId: string, testId: string) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    context.guidedState.phase = 'confirm'

    if (context.guidedState.steps[0]) {
      context.guidedState.steps[0].status = 'completed'
      context.guidedState.steps[0].response = 'no'
    }

    updateSessionMeta(context.session)
    persist()
  }

  const setGuidedUserVerdict = (sessionId: string, testId: string, verdict: DiagnosticGuidedUserVerdict) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context) {
      return
    }

    context.guidedState.userVerdict = verdict
    updateSessionMeta(context.session)
    persist()
  }

  const finalizeGuidedTest = (sessionId: string, testId: string) => {
    const context = getGuidedContext(sessionId, testId)

    if (!context || !context.definition.finalizeGuidedResult) {
      return null
    }

    const result = context.definition.finalizeGuidedResult(context.guidedState as DiagnosticGuidedState)
    markResult(context.session, testId, result)
    persist()

    return result
  }

  const resetSession = () => {
    if (activeSession.value) {
      clearSessionMedia(activeSession.value.id)
    } else {
      clearAllSessionMedia()
    }

    activeSession.value = null
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore storage cleanup failures in restricted Safari contexts.
      }
    }
  }

  return {
    activeSession,
    currentScore,
    ensureHydrated,
    finalizeGuidedTest,
    completeGuidedStep,
    getCurrentGuidedSubStep,
    getFirstIncompleteStep,
    getNextStep,
    getSessionById,
    getStepByTestId,
    getTestDefinition,
    moveGuidedTestToConfirm,
    recordGuidedStepResponse,
    resumeSession,
    runTest,
    sessionProgress,
    setGuidedUserVerdict,
    startGuidedTest,
    startSession,
    resetSession,
    testDefinitions,
    updateGuidedMetrics
  }
})
