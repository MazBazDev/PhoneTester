import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildRotationDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const orientationsSeen = Array.isArray(state.metrics.orientationsSeen) ? state.metrics.orientationsSeen : []
  const hasGyroscopeData = Boolean(state.metrics.hasGyroscopeData)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Orientations vues', value: orientationsSeen.length > 0 ? orientationsSeen.join(', ') : 'aucune' },
    { label: 'Capteur orientation actif', value: hasGyroscopeData ? 'oui' : 'non' }
  ]
}

const buildRotationStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const orientationsSeen = Array.isArray(state.metrics.orientationsSeen) ? state.metrics.orientationsSeen : []
  const hasPortrait = orientationsSeen.includes('portrait')
  const hasLandscape = orientationsSeen.includes('landscape')

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied') {
    return 'warning'
  }

  if (hasPortrait && hasLandscape && state.userVerdict === 'pass') {
    return 'pass'
  }

  return 'warning'
}

export const useRotationTest = (): DiagnosticTestDefinition => ({
  id: 'rotation',
  name: 'Rotation',
  description: 'Tourne le telephone pour detecter portrait, paysage et activite capteur.',
  icon: 'rotate',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'rotation-live',
        label: 'Rotation live',
        instruction: 'Tourne le telephone entre portrait et paysage pour verifier la detection.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      orientationsSeen: [],
      orientation: 'unknown',
      alpha: 0,
      beta: 0,
      gamma: 0,
      hasGyroscopeData: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildRotationStatus(state)
    const orientationsSeen = Array.isArray(state.metrics.orientationsSeen) ? state.metrics.orientationsSeen : []

    return {
      testId: 'rotation',
      status,
      summary:
        orientationsSeen.includes('portrait') && orientationsSeen.includes('landscape')
          ? 'Les deux orientations principales ont ete observees pendant le test.'
          : 'La rotation n’a pas montre toutes les orientations attendues ou reste incertaine.',
      details: buildRotationDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
