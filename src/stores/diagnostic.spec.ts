import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDiagnosticStore } from './diagnostic'

describe('diagnostic store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.stubGlobal('crypto', {
      randomUUID: () => 'session-1'
    })
  })

  it('creates and persists a new session', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    expect(session.id).toBe('session-1')
    expect(session.steps).toHaveLength(2)
    expect(JSON.parse(localStorage.getItem('phone-tester.active-session') || '{}').id).toBe('session-1')
  })

  it('hydrates a stored session', () => {
    localStorage.setItem(
      'phone-tester.active-session',
      JSON.stringify({
        id: 'stored-session',
        status: 'draft',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        deviceTarget: 'iphone-safari',
        steps: [
          { testId: 'device-info', status: 'completed', result: { testId: 'device-info', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' } },
          { testId: 'permissions', status: 'pending', result: null }
        ]
      })
    )

    const store = useDiagnosticStore()
    store.ensureHydrated()

    expect(store.activeSession?.id).toBe('stored-session')
    expect(store.getFirstIncompleteStep('stored-session')?.testId).toBe('permissions')
  })

  it('runs a test and computes progress', async () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    await store.runTest(session.id, 'device-info')

    expect(store.getStepByTestId(session.id, 'device-info')?.result?.testId).toBe('device-info')
    expect(store.sessionProgress).toBe(50)
  })

  it('resets the persisted session', () => {
    const store = useDiagnosticStore()
    store.startSession()
    store.resetSession()

    expect(store.activeSession).toBeNull()
    expect(localStorage.getItem('phone-tester.active-session')).toBeNull()
  })
})
