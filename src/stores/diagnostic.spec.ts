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

  it('creates and persists a new session with all current tests', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    expect(session.id).toBe('session-1')
    expect(session.steps).toHaveLength(10)
    expect(store.getStepByTestId(session.id, 'screen')?.guidedState?.steps).toHaveLength(6)
    expect(JSON.parse(localStorage.getItem('phone-tester.active-session') || '{}').id).toBe('session-1')
  })

  it('hydrates a stored guided session', () => {
    localStorage.setItem(
      'phone-tester.active-session',
      JSON.stringify({
        id: 'stored-session',
        status: 'draft',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        deviceTarget: 'iphone-safari',
        steps: [
          { testId: 'screen', status: 'completed', result: { testId: 'screen', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          { testId: 'touch', status: 'completed', result: { testId: 'touch', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          { testId: 'multitouch', status: 'completed', result: { testId: 'multitouch', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          { testId: 'rotation', status: 'completed', result: { testId: 'rotation', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          { testId: 'accelerometer', status: 'completed', result: { testId: 'accelerometer', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          { testId: 'gyroscope', status: 'completed', result: { testId: 'gyroscope', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
          {
            testId: 'compass',
            status: 'running',
            result: null,
            guidedState: {
              phase: 'active',
              startedAt: '2025-01-01T00:00:00.000Z',
              currentStepIndex: 0,
              steps: [{ id: 'compass-live', label: 'Compas live', instruction: 'step', status: 'active', response: null }],
              metrics: { supported: true, permissionState: 'granted', heading: 25, headingDetected: true, cardinal: 'nord', alpha: 25, beta: 0, gamma: 0 },
              userVerdict: null
            }
          },
          {
            testId: 'gps',
            status: 'pending',
            result: null,
            guidedState: {
              phase: 'idle',
              startedAt: null,
              currentStepIndex: 0,
              steps: [{ id: 'gps-live', label: 'Acquisition GPS', instruction: 'step', status: 'pending', response: null }],
              metrics: { supported: true, permissionState: 'unknown', acquired: false },
              userVerdict: null
            }
          },
          { testId: 'microphone', status: 'pending', result: null, guidedState: { phase: 'idle', startedAt: null, currentStepIndex: 0, steps: [{ id: 'microphone-live', label: 'Micro live', instruction: 'step', status: 'pending', response: null }], metrics: { supported: true, permissionState: 'unknown', streamOpened: false, level: 0, peakLevel: 0, soundDetected: false }, userVerdict: null } },
          { testId: 'camera', status: 'pending', result: null, guidedState: { phase: 'idle', startedAt: null, currentStepIndex: 0, steps: [{ id: 'rear-capture', label: 'Objectifs arriere', instruction: 'step', status: 'pending', response: null }, { id: 'autofocus-near', label: 'Autofocus proche', instruction: 'step', status: 'pending', response: null }, { id: 'autofocus-far', label: 'Autofocus loin', instruction: 'step', status: 'pending', response: null }, { id: 'front-capture', label: 'Camera avant', instruction: 'step', status: 'pending', response: null }], metrics: { supported: true, permissionState: 'unknown', streamOpened: false, rearAvailableDeviceIds: [], rearCapturedDeviceIds: [], nearValidated: false, farValidated: false, frontCaptureSucceeded: false }, userVerdict: null } }
        ]
      })
    )

    const store = useDiagnosticStore()
    store.ensureHydrated()

    expect(store.activeSession?.id).toBe('stored-session')
    expect(store.getFirstIncompleteStep('stored-session')?.testId).toBe('compass')
    expect(store.getCurrentGuidedSubStep('stored-session', 'compass')?.id).toBe('compass-live')
  })

  it('runs an automatic test and computes progress', async () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.finalizeGuidedTest(session.id, 'screen')

    expect(store.getStepByTestId(session.id, 'screen')?.result?.testId).toBe('screen')
    expect(store.sessionProgress).toBe(10)
  })

  it('finalizes compass and gps guided tests', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'compass')
    store.updateGuidedMetrics(session.id, 'compass', {
      supported: true,
      permissionState: 'granted',
      heading: 24,
      headingDetected: true,
      cardinal: 'nord',
      alpha: 24,
      beta: 0,
      gamma: 0
    })
    store.moveGuidedTestToConfirm(session.id, 'compass')
    store.setGuidedUserVerdict(session.id, 'compass', 'pass')
    store.finalizeGuidedTest(session.id, 'compass')

    store.startGuidedTest(session.id, 'gps')
    store.updateGuidedMetrics(session.id, 'gps', {
      supported: true,
      permissionState: 'granted',
      acquired: true,
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 14.2,
      altitude: 31,
      speed: 0,
      acquiredInMs: 1800
    })
    store.moveGuidedTestToConfirm(session.id, 'gps')
    store.setGuidedUserVerdict(session.id, 'gps', 'pass')
    store.finalizeGuidedTest(session.id, 'gps')

    expect(store.getStepByTestId(session.id, 'compass')?.result?.status).toBe('pass')
    expect(store.getStepByTestId(session.id, 'gps')?.result?.status).toBe('pass')
  })

  it('finalizes the unified camera guided test', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      rearAvailableDeviceIds: ['rear-1', 'rear-2', 'rear-3'],
      rearCapturedDeviceIds: ['rear-1', 'rear-2', 'rear-3'],
      nearValidated: true,
      farValidated: true,
      frontCaptureSucceeded: true
    })
    store.moveGuidedTestToConfirm(session.id, 'camera')
    store.setGuidedUserVerdict(session.id, 'camera', 'pass')
    store.finalizeGuidedTest(session.id, 'camera')

    expect(store.getStepByTestId(session.id, 'camera')?.result?.status).toBe('pass')
  })

  it('finalizes microphone guided test', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'microphone')
    store.updateGuidedMetrics(session.id, 'microphone', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      level: 0.18,
      peakLevel: 0.45,
      soundDetected: true
    })
    store.moveGuidedTestToConfirm(session.id, 'microphone')
    store.setGuidedUserVerdict(session.id, 'microphone', 'pass')
    store.finalizeGuidedTest(session.id, 'microphone')

    expect(store.getStepByTestId(session.id, 'microphone')?.result?.status).toBe('pass')
  })

  it('finalizes multitouch guided test', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'multitouch')
    store.updateGuidedMetrics(session.id, 'multitouch', {
      activeTouches: 0,
      maxSimultaneousTouches: 3
    })
    store.moveGuidedTestToConfirm(session.id, 'multitouch')
    store.setGuidedUserVerdict(session.id, 'multitouch', 'pass')
    store.finalizeGuidedTest(session.id, 'multitouch')

    expect(store.getStepByTestId(session.id, 'multitouch')?.result?.status).toBe('pass')
  })

  it('progresses through the unified camera guided substeps', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      rearAvailableDeviceIds: ['rear-1'],
      rearCapturedDeviceIds: ['rear-1']
    })
    store.completeGuidedStep(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      nearValidated: true
    })
    store.completeGuidedStep(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      farValidated: true
    })
    store.completeGuidedStep(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      frontCaptureSucceeded: true
    })
    store.setGuidedUserVerdict(session.id, 'camera', 'pass')
    store.finalizeGuidedTest(session.id, 'camera')

    expect(store.getCurrentGuidedSubStep(session.id, 'camera')?.id).toBe('front-capture')
    expect(store.getStepByTestId(session.id, 'camera')?.result?.status).toBe('pass')
  })

  it('resets an individual completed step', async () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.finalizeGuidedTest(session.id, 'screen')
    expect(store.getStepByTestId(session.id, 'screen')?.result).not.toBeNull()

    store.resetStep(session.id, 'screen')

    expect(store.getStepByTestId(session.id, 'screen')?.result).toBeNull()
    expect(store.getStepByTestId(session.id, 'screen')?.status).toBe('pending')
  })

  it('resets the persisted session', () => {
    const store = useDiagnosticStore()
    store.startSession()
    store.resetSession()

    expect(store.activeSession).toBeNull()
    expect(localStorage.getItem('phone-tester.active-session')).toBeNull()
  })
})
