import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const MOTION_THRESHOLD = 2

const formatTilt = (tilt: string) => {
  if (tilt === 'left') return 'gauche'
  if (tilt === 'right') return 'droite'
  if (tilt === 'up') return 'haut'
  if (tilt === 'down') return 'bas'
  return 'aucune'
}

const buildAccelerometerDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const currentTilt = String(state.metrics.currentTilt ?? 'none')
  const observedTilts = Array.isArray(state.metrics.observedTilts) ? state.metrics.observedTilts : []

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Inclinaison courante', value: formatTilt(currentTilt) },
    { label: 'Directions observees', value: observedTilts.length > 0 ? observedTilts.map((tilt) => formatTilt(String(tilt))).join(', ') : 'aucune' }
  ]
}

const buildAccelerometerStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const observedTilts = Array.isArray(state.metrics.observedTilts) ? state.metrics.observedTilts : []
  const completed = ['left', 'right', 'up', 'down'].every((direction) => observedTilts.includes(direction))

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied') {
    return 'warning'
  }

  if (state.userVerdict === 'warning') {
    return 'warning'
  }

  return completed ? 'pass' : 'warning'
}

export const useAccelerometerTest = (): DiagnosticTestDefinition => ({
  id: 'accelerometer',
  name: 'Accelerometre',
  description: "Verifie que le telephone reagit bien a une inclinaison a plat dans les quatre directions.",
  icon: 'activity',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'accelerometer-live',
        label: 'Inclinaisons',
        instruction: 'Garde le telephone face a toi et incline-le a gauche, a droite, vers le haut et vers le bas.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      x: 0,
      y: 0,
      z: 0,
      currentTilt: 'none',
      observedTilts: [],
      threshold: MOTION_THRESHOLD
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildAccelerometerStatus(state)
    const observedTilts = Array.isArray(state.metrics.observedTilts) ? state.metrics.observedTilts : []
    const completed = ['left', 'right', 'up', 'down'].every((direction) => observedTilts.includes(direction))

    return {
      testId: 'accelerometer',
      status,
      summary: completed
        ? "Les quatre inclinaisons attendues ont bien ete detectees."
        : "Le test d'inclinaison reste partiel ou incertain.",
      details: buildAccelerometerDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
