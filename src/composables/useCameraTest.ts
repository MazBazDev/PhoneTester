import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const getStringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []

const getRearObjectiveCount = (state: DiagnosticGuidedState) => {
  const ids = getStringList(state.metrics.rearAvailableDeviceIds)
  return ids.length > 0 ? ids.length : 1
}

const getRearCapturedCount = (state: DiagnosticGuidedState) => {
  const ids = getStringList(state.metrics.rearCapturedDeviceIds)
  return ids.length
}

const buildCameraDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Permission camera', value: String(state.metrics.permissionState ?? 'unknown') },
  { label: 'Objectifs arriere', value: `${getRearCapturedCount(state)}/${getRearObjectiveCount(state)}` },
  { label: 'Autofocus proche', value: Boolean(state.metrics.nearValidated) ? 'valide' : 'non valide' },
  { label: 'Autofocus loin', value: Boolean(state.metrics.farValidated) ? 'valide' : 'non valide' },
  {
    label: 'Camera avant',
    value: Boolean(state.metrics.frontCaptureSucceeded) ? 'capturee' : 'non capturee',
    previewKey: Boolean(state.metrics.frontCaptureSucceeded) ? 'camera-front' : undefined
  }
]

const buildCameraStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const streamOpened = Boolean(state.metrics.streamOpened)
  const rearDone = getRearCapturedCount(state) >= getRearObjectiveCount(state)
  const nearDone = Boolean(state.metrics.nearValidated)
  const farDone = Boolean(state.metrics.farValidated)
  const frontDone = Boolean(state.metrics.frontCaptureSucceeded)

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

  return rearDone && nearDone && farDone && frontDone ? 'pass' : 'warning'
}

export const useCameraTest = (): DiagnosticTestDefinition => ({
  id: 'camera',
  name: 'Camera',
  description: 'Verifie les objectifs arriere, la mise au point et la camera avant dans un seul parcours.',
  icon: 'camera',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'rear-capture',
        label: 'Objectifs arriere',
        instruction: 'Prends une photo nette avec chaque objectif arriere detecte.',
        status: 'pending',
        response: null
      },
      {
        id: 'autofocus-near',
        label: 'Autofocus proche',
        instruction: 'Cadre un objet proche et verifie que la mise au point se fait bien.',
        status: 'pending',
        response: null
      },
      {
        id: 'autofocus-far',
        label: 'Autofocus loin',
        instruction: 'Cadre un sujet plus loin et verifie que l’image redevient nette.',
        status: 'pending',
        response: null
      },
      {
        id: 'front-capture',
        label: 'Camera avant',
        instruction: 'Passe sur la camera avant puis prends une photo de test.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      streamOpened: false,
      activeDeviceLabel: 'inconnue',
      activeDeviceId: null,
      previewReady: false,
      rearAvailableDeviceIds: [],
      rearCapturedDeviceIds: [],
      rearCurrentDeviceId: null,
      nearValidated: false,
      farValidated: false,
      frontCaptureSucceeded: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'camera',
    status: buildCameraStatus(state),
    summary:
      buildCameraStatus(state) === 'pass'
        ? 'Les objectifs utiles, la mise au point et la camera avant ont pu etre verifies.'
        : 'Le controle camera reste partiel, douteux ou incomplet.',
    details: buildCameraDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
