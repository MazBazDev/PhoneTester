import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { diagnosticTests, diagnosticTestMap } from '../data/diagnosticTests'
import type {
  DiagnosticSession,
  DiagnosticSessionStep,
  DiagnosticTestDefinition,
  DiagnosticTestRunResult
} from '../domain/diagnostic'

const STORAGE_KEY = 'phone-tester.active-session'

const buildSteps = (): DiagnosticSessionStep[] =>
  diagnosticTests.map((test) => ({
    testId: test.id,
    status: 'pending',
    result: null
  }))

const buildSession = (): DiagnosticSession => ({
  id: crypto.randomUUID(),
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deviceTarget: 'iphone-safari',
  steps: buildSteps()
})

const isBrowser = () => typeof window !== 'undefined'

export const useDiagnosticStore = defineStore('diagnostic', () => {
  const activeSession = ref<DiagnosticSession | null>(null)
  const hydrated = ref(false)

  const persist = () => {
    if (!isBrowser()) {
      return
    }

    if (!activeSession.value) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession.value))
  }

  const hydrateFromStorage = () => {
    if (hydrated.value || !isBrowser()) {
      hydrated.value = true
      return
    }

    const rawSession = window.localStorage.getItem(STORAGE_KEY)

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

  const markResult = (session: DiagnosticSession, stepId: string, result: DiagnosticTestRunResult) => {
    const step = session.steps.find((entry) => entry.testId === stepId)

    if (!step) {
      return
    }

    step.status = 'completed'
    step.result = result
    session.updatedAt = new Date().toISOString()
    session.status = session.steps.every((entry) => entry.result !== null) ? 'completed' : 'draft'
  }

  const runTest = async (sessionId: string, testId: string) => {
    const session = getSessionById(sessionId)
    const definition = getTestDefinition(testId)

    if (!session || !definition) {
      return null
    }

    const step = session.steps.find((entry) => entry.testId === testId)

    if (!step) {
      return null
    }

    step.status = 'running'
    session.updatedAt = new Date().toISOString()

    const result = await definition.run()
    markResult(session, testId, result)
    persist()

    return result
  }

  const resetSession = () => {
    activeSession.value = null
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    activeSession,
    currentScore,
    ensureHydrated,
    getFirstIncompleteStep,
    getNextStep,
    getSessionById,
    getStepByTestId,
    getTestDefinition,
    resumeSession,
    runTest,
    sessionProgress,
    startSession,
    resetSession,
    testDefinitions
  }
})
