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
    expect(session.steps).toHaveLength(13)
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
          { testId: 'device-info', status: 'completed', result: { testId: 'device-info', status: 'pass', summary: 'ok', details: [], startedAt: '', finishedAt: '' }, guidedState: null },
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
          { testId: 'camera-rear', status: 'pending', result: null, guidedState: { phase: 'idle', startedAt: null, currentStepIndex: 0, steps: [{ id: 'rear-live', label: 'Flux arriere', instruction: 'step', status: 'pending', response: null }], metrics: { supported: true, permissionState: 'unknown', streamOpened: false, captureSucceeded: false, capturePreviewAvailable: false }, userVerdict: null } },
          { testId: 'camera-front', status: 'pending', result: null, guidedState: { phase: 'idle', startedAt: null, currentStepIndex: 0, steps: [{ id: 'front-live', label: 'Flux avant', instruction: 'step', status: 'pending', response: null }], metrics: { supported: true, permissionState: 'unknown', streamOpened: false, captureSucceeded: false, capturePreviewAvailable: false }, userVerdict: null } },
          { testId: 'autofocus', status: 'pending', result: null, guidedState: { phase: 'idle', startedAt: null, currentStepIndex: 0, steps: [{ id: 'autofocus-near', label: 'Pres', instruction: 'step', status: 'pending', response: null }, { id: 'autofocus-far', label: 'Loin', instruction: 'step', status: 'pending', response: null }], metrics: { supported: true, permissionState: 'unknown', streamOpened: false, nearValidated: false, farValidated: false }, userVerdict: null } }
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

    await store.runTest(session.id, 'device-info')

    expect(store.getStepByTestId(session.id, 'device-info')?.result?.testId).toBe('device-info')
    expect(store.sessionProgress).toBe(8)
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

  it('finalizes rear and front camera guided tests', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'camera-rear')
    store.updateGuidedMetrics(session.id, 'camera-rear', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      activeDeviceLabel: 'Back Camera',
      availableDeviceCount: 3,
      captureSucceeded: true,
      capturePreviewAvailable: true
    })
    store.moveGuidedTestToConfirm(session.id, 'camera-rear')
    store.setGuidedUserVerdict(session.id, 'camera-rear', 'pass')
    store.finalizeGuidedTest(session.id, 'camera-rear')

    store.startGuidedTest(session.id, 'camera-front')
    store.updateGuidedMetrics(session.id, 'camera-front', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      activeDeviceLabel: 'Front Camera',
      availableDeviceCount: 1,
      captureSucceeded: true,
      capturePreviewAvailable: true
    })
    store.moveGuidedTestToConfirm(session.id, 'camera-front')
    store.setGuidedUserVerdict(session.id, 'camera-front', 'pass')
    store.finalizeGuidedTest(session.id, 'camera-front')

    expect(store.getStepByTestId(session.id, 'camera-rear')?.result?.status).toBe('pass')
    expect(store.getStepByTestId(session.id, 'camera-front')?.result?.status).toBe('pass')
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

  it('progresses and finalizes autofocus guided test', () => {
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'autofocus')
    store.updateGuidedMetrics(session.id, 'autofocus', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      activeDeviceLabel: 'Back Camera',
      nearValidated: true
    })
    store.completeGuidedStep(session.id, 'autofocus')
    store.updateGuidedMetrics(session.id, 'autofocus', {
      farValidated: true
    })
    store.completeGuidedStep(session.id, 'autofocus')
    store.setGuidedUserVerdict(session.id, 'autofocus', 'pass')
    store.finalizeGuidedTest(session.id, 'autofocus')

    expect(store.getCurrentGuidedSubStep(session.id, 'autofocus')?.id).toBe('autofocus-far')
    expect(store.getStepByTestId(session.id, 'autofocus')?.result?.status).toBe('pass')
  })

  it('resets the persisted session', () => {
    const store = useDiagnosticStore()
    store.startSession()
    store.resetSession()

    expect(store.activeSession).toBeNull()
    expect(localStorage.getItem('phone-tester.active-session')).toBeNull()
  })
})
