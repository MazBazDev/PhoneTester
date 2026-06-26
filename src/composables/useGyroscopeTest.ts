import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const ROTATION_RATE_THRESHOLD = 15

const buildGyroscopeDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const maxAbsAlpha = Number(state.metrics.maxAbsAlpha ?? 0).toFixed(2)
  const maxAbsBeta = Number(state.metrics.maxAbsBeta ?? 0).toFixed(2)
  const maxAbsGamma = Number(state.metrics.maxAbsGamma ?? 0).toFixed(2)
  const variationDetected = Boolean(state.metrics.variationDetected)

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Rotation alpha max', value: maxAbsAlpha },
    { label: 'Rotation beta max', value: maxAbsBeta },
    { label: 'Rotation gamma max', value: maxAbsGamma },
    { label: 'Rotation detectee', value: variationDetected ? 'oui' : 'non' }
  ]
}

const buildGyroscopeStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const variationDetected = Boolean(state.metrics.variationDetected)

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied') {
    return 'warning'
  }

  if (variationDetected && state.userVerdict === 'pass') {
    return 'pass'
  }

  return 'warning'
}

export const useGyroscopeTest = (): DiagnosticTestDefinition => ({
  id: 'gyroscope',
  name: 'Gyroscope',
  description: 'Observe les vitesses de rotation temps reel pour confirmer le gyroscope.',
  icon: 'gyro',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'gyroscope-live',
        label: 'Rotation live',
        instruction: 'Fais pivoter doucement le telephone dans plusieurs directions.',
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
      maxAbsAlpha: 0,
      maxAbsBeta: 0,
      maxAbsGamma: 0,
      variationDetected: false,
      threshold: ROTATION_RATE_THRESHOLD
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildGyroscopeStatus(state)
    const variationDetected = Boolean(state.metrics.variationDetected)

    return {
      testId: 'gyroscope',
      status,
      summary: variationDetected
        ? 'Une rotation rate exploitable a ete detectee sur le test.'
        : 'La rotation rate reste trop faible ou indisponible sur ce test.',
      details: buildGyroscopeDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
