import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const ROTATION_RATE_THRESHOLD = 15

const formatAxis = (axis: string) => {
  if (axis === 'alpha') return 'alpha'
  if (axis === 'beta') return 'beta'
  if (axis === 'gamma') return 'gamma'
  return 'aucun'
}

const buildGyroscopeDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const currentAxis = String(state.metrics.currentAxis ?? 'none')
  const observedAxes = Array.isArray(state.metrics.observedAxes) ? state.metrics.observedAxes : []

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Axe courant', value: formatAxis(currentAxis) },
    { label: 'Axes observes', value: observedAxes.length > 0 ? observedAxes.map((axis) => formatAxis(String(axis))).join(', ') : 'aucun' }
  ]
}

const buildGyroscopeStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const observedAxes = Array.isArray(state.metrics.observedAxes) ? state.metrics.observedAxes : []
  const completed = ['alpha', 'beta', 'gamma'].every((axis) => observedAxes.includes(axis))

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied') {
    return 'warning'
  }

  if (completed && state.userVerdict === 'pass') {
    return 'pass'
  }

  return 'warning'
}

export const useGyroscopeTest = (): DiagnosticTestDefinition => ({
  id: 'gyroscope',
  name: 'Gyroscope',
  description: 'Verifie que le telephone detecte bien des rotations sur les trois axes du gyroscope.',
  icon: 'gyro',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'gyroscope-live',
        label: 'Rotation multi-axes',
        instruction: 'Fais pivoter le telephone autour de lui-meme dans plusieurs orientations pour activer les trois axes.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      alpha: 0,
      beta: 0,
      gamma: 0,
      currentAxis: 'none',
      observedAxes: [],
      threshold: ROTATION_RATE_THRESHOLD
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildGyroscopeStatus(state)
    const observedAxes = Array.isArray(state.metrics.observedAxes) ? state.metrics.observedAxes : []
    const completed = ['alpha', 'beta', 'gamma'].every((axis) => observedAxes.includes(axis))

    return {
      testId: 'gyroscope',
      status,
      summary: completed
        ? 'Les trois axes gyroscopiques ont bien montre une rotation exploitable.'
        : 'Le test gyroscope reste partiel ou incertain.',
      details: buildGyroscopeDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
