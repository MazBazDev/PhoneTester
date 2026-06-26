import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDiagnosticStore } from './diagnostic'

describe('diagnostic store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', {
      randomUUID: () => 'session-1'
    })
  })

  it('creates a new session with profile data', () => {
    const store = useDiagnosticStore()
    const session = store.startSession({
      brand: 'Apple',
      model: 'iPhone 14',
      storage: '128 Go'
    })

    expect(session.id).toBe('session-1')
    expect(session.phoneProfile.brand).toBe('Apple')
    expect(session.sections).toHaveLength(5)
    expect(store.activeSessionId).toBe('session-1')
  })

  it('stores answers and computes progress', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.answerCheck(session.id, 'identity', 'serial-match', 'ok')
    store.answerCheck(session.id, 'identity', 'icloud-lock', 'warning')

    expect(store.getSessionById(session.id)?.sections[0].completed).toBe(true)
    expect(store.getProgress(session.id)).toBe(20)
  })

  it('returns next section and completes status when all checks are answered', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    for (const section of session.sections) {
      for (const check of section.checks) {
        store.answerCheck(session.id, section.id, check.id, 'ok')
      }
    }

    expect(store.goToNextSection(session.id, 'identity')?.id).toBe('physical')
    expect(store.getSessionById(session.id)?.status).toBe('completed')
  })

  it('resets all in-memory sessions', () => {
    const store = useDiagnosticStore()
    store.startSession()
    store.resetSession()

    expect(store.sessions).toEqual([])
    expect(store.activeSessionId).toBeNull()
  })
})
