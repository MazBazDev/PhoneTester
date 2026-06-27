import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildFrontDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Permission camera', value: String(state.metrics.permissionState ?? 'unknown') },
  { label: 'Camera active', value: String(state.metrics.activeDeviceLabel ?? 'inconnue') },
  {
    label: 'Capture',
    value: Boolean(state.metrics.captureSucceeded) ? 'reussie' : 'non capturee',
    previewKey: Boolean(state.metrics.capturePreviewAvailable) ? 'front-preview' : undefined
  }
]

const buildFrontStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const streamOpened = Boolean(state.metrics.streamOpened)
  const captureSucceeded = Boolean(state.metrics.captureSucceeded)

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied' || !streamOpened) {
    return 'failed'
  }

  if (state.userVerdict === 'warning') {
    return 'warning'
  }

  return captureSucceeded ? 'pass' : 'warning'
}

export const useCameraFrontTest = (): DiagnosticTestDefinition => ({
  id: 'camera-front',
  name: 'Camera avant',
  description: 'Affiche le flux avant et valide une vraie capture photo.',
  icon: 'camera-front',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'front-live',
        label: 'Flux avant',
        instruction: 'Verifie le flux avant puis capture une photo nette de test.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      streamOpened: false,
      activeDeviceLabel: 'inconnue',
      availableDeviceCount: 0,
      activeDeviceId: null,
      previewReady: false,
      captureSucceeded: false,
      capturePreviewAvailable: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'camera-front',
    status: buildFrontStatus(state),
    summary:
      buildFrontStatus(state) === 'pass'
        ? 'Le flux avant et la capture photo ont fonctionne correctement.'
        : 'Le test camera avant reste partiel, douteux ou a echoue.',
    details: buildFrontDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
