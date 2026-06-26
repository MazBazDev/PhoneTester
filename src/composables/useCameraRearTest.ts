import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildRearDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Permission camera', value: String(state.metrics.permissionState ?? 'unknown') },
  { label: 'Camera active', value: String(state.metrics.activeDeviceLabel ?? 'inconnue') },
  { label: 'Objectifs detectes', value: String(state.metrics.availableDeviceCount ?? 0) },
  {
    label: 'Capture',
    value: Boolean(state.metrics.captureSucceeded) ? 'reussie' : 'non capturee',
    previewKey: Boolean(state.metrics.capturePreviewAvailable) ? 'rear-preview' : undefined
  }
]

const buildRearStatus = (state: DiagnosticGuidedState): TestStatus => {
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

  if (captureSucceeded && state.userVerdict === 'pass') {
    return 'pass'
  }

  return 'warning'
}

export const useCameraRearTest = (): DiagnosticTestDefinition => ({
  id: 'camera-rear',
  name: 'Camera arriere',
  description: 'Affiche le flux arriere, permet une vraie capture et le changement d’objectif si disponible.',
  icon: 'camera',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'rear-live',
        label: 'Flux arriere',
        instruction: 'Verifie le flux, capture une photo, puis change d’objectif si plusieurs cameras sont detectees.',
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
      captureSucceeded: false,
      capturePreviewAvailable: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'camera-rear',
    status: buildRearStatus(state),
    summary:
      Boolean(state.metrics.captureSucceeded) && state.userVerdict === 'pass'
        ? 'Le flux arriere et la capture photo ont fonctionne correctement.'
        : 'Le test camera arriere reste partiel, douteux ou a echoue.',
    details: buildRearDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
