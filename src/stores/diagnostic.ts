import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { diagnosticCatalog } from '../data/diagnosticCatalog'
import type {
  DiagnosticAnswer,
  DiagnosticSession,
  DiagnosticSectionState,
  PhoneProfile
} from '../domain/diagnostic'

const defaultPhoneProfile = (): PhoneProfile => ({
  brand: '',
  model: '',
  storage: ''
})

const buildSections = (): DiagnosticSectionState[] =>
  diagnosticCatalog.map((section) => ({
    ...section,
    answers: [],
    completed: false
  }))

const isSectionCompleted = (section: DiagnosticSectionState) => section.answers.length === section.checks.length

export const useDiagnosticStore = defineStore('diagnostic', () => {
  const sessions = ref<DiagnosticSession[]>([])
  const activeSessionId = ref<string | null>(null)

  const activeSession = computed(() =>
    sessions.value.find((session) => session.id === activeSessionId.value) ?? null
  )

  const startSession = (phoneProfile?: Partial<PhoneProfile>) => {
    const session: DiagnosticSession = {
      id: crypto.randomUUID(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      phoneProfile: {
        ...defaultPhoneProfile(),
        ...phoneProfile
      },
      sections: buildSections()
    }

    sessions.value.push(session)
    activeSessionId.value = session.id

    return session
  }

  const getSessionById = (sessionId: string) =>
    sessions.value.find((session) => session.id === sessionId) ?? null

  const answerCheck = (sessionId: string, sectionId: string, checkId: string, value: string) => {
    const session = getSessionById(sessionId)

    if (!session) {
      return
    }

    const section = session.sections.find((entry) => entry.id === sectionId)

    if (!section) {
      return
    }

    const existingAnswer = section.answers.find((answer) => answer.checkId === checkId)
    const nextAnswer: DiagnosticAnswer = { checkId, value }

    if (existingAnswer) {
      existingAnswer.value = value
    } else {
      section.answers.push(nextAnswer)
    }

    section.completed = isSectionCompleted(section)
    session.status = session.sections.every((entry) => entry.completed) ? 'completed' : 'draft'
  }

  const goToNextSection = (sessionId: string, sectionId: string) => {
    const session = getSessionById(sessionId)

    if (!session) {
      return null
    }

    const index = session.sections.findIndex((section) => section.id === sectionId)

    if (index === -1) {
      return null
    }

    return session.sections[index + 1] ?? null
  }

  const getProgress = (sessionId: string) => {
    const session = getSessionById(sessionId)

    if (!session) {
      return 0
    }

    const completedChecks = session.sections.reduce((total, section) => total + section.answers.length, 0)
    const totalChecks = session.sections.reduce((total, section) => total + section.checks.length, 0)

    return totalChecks === 0 ? 0 : Math.round((completedChecks / totalChecks) * 100)
  }

  const resetSession = () => {
    activeSessionId.value = null
    sessions.value = []
  }

  return {
    activeSession,
    activeSessionId,
    sessions,
    startSession,
    getSessionById,
    answerCheck,
    goToNextSection,
    getProgress,
    resetSession
  }
})
