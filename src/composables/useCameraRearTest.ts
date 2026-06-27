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
    label: 'Objectifs captures',
    value: `${Array.isArray(state.metrics.capturedDeviceIds) ? state.metrics.capturedDeviceIds.length : 0}/${Number(state.metrics.availableDeviceCount ?? 0)}`,
  },
  {
    label: 'Couverture',
    value: Boolean(state.metrics.captureSucceeded) ? 'complete' : 'incomplete',
    previewKey: Boolean(state.metrics.capturePreviewAvailable) ? 'rear-preview' : undefined
  }
]

const buildRearStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const streamOpened = Boolean(state.metrics.streamOpened)
  const availableDeviceCount = Number(state.metrics.availableDeviceCount ?? 0)
  const capturedDeviceIds = Array.isArray(state.metrics.capturedDeviceIds) ? state.metrics.capturedDeviceIds : []
  const allObjectivesCaptured = availableDeviceCount > 0 && capturedDeviceIds.length >= availableDeviceCount

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied' || !streamOpened) {
    return 'failed'
  }

  if (allObjectivesCaptured && state.userVerdict === 'pass') {
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
        instruction: 'Verifie le flux puis capture une photo sur chaque objectif arriere detecte.',
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
      availableDeviceIds: [],
      testedDeviceIds: [],
      capturedDeviceIds: [],
      activeDeviceId: null,
      previewReady: false,
      captureSucceeded: false,
      capturePreviewAvailable: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'camera-rear',
    status: buildRearStatus(state),
    summary:
      buildRearStatus(state) === 'pass'
        ? 'Tous les objectifs arriere detectes ont ete verifies et captures correctement.'
        : 'Le test camera arriere reste partiel, douteux ou incomplet.',
    details: buildRearDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
