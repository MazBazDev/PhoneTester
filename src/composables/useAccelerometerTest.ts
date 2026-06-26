import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const MOTION_THRESHOLD = 2

const buildAccelerometerDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const maxAbsX = Number(state.metrics.maxAbsX ?? 0).toFixed(2)
  const maxAbsY = Number(state.metrics.maxAbsY ?? 0).toFixed(2)
  const maxAbsZ = Number(state.metrics.maxAbsZ ?? 0).toFixed(2)
  const variationDetected = Boolean(state.metrics.variationDetected)

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Amplitude X', value: maxAbsX },
    { label: 'Amplitude Y', value: maxAbsY },
    { label: 'Amplitude Z', value: maxAbsZ },
    { label: 'Variation detectee', value: variationDetected ? 'oui' : 'non' }
  ]
}

const buildAccelerometerStatus = (state: DiagnosticGuidedState): TestStatus => {
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

export const useAccelerometerTest = (): DiagnosticTestDefinition => ({
  id: 'accelerometer',
  name: 'Accelerometre',
  description: 'Affiche les axes X/Y/Z en temps reel et verifie une vraie variation de mouvement.',
  icon: 'activity',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'accelerometer-live',
        label: 'Capteur live',
        instruction: 'Incline et bouge legerement le telephone pour voir varier les 3 axes.',
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
      maxAbsX: 0,
      maxAbsY: 0,
      maxAbsZ: 0,
      variationDetected: false,
      threshold: MOTION_THRESHOLD
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildAccelerometerStatus(state)
    const variationDetected = Boolean(state.metrics.variationDetected)

    return {
      testId: 'accelerometer',
      status,
      summary: variationDetected
        ? 'Le capteur a montre une variation nette sur les axes mesures.'
        : 'La variation des axes reste faible ou incertaine sur ce test.',
      details: buildAccelerometerDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
