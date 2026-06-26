import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildRotationDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const observedOrientations = Array.isArray(state.metrics.observedOrientations) ? state.metrics.observedOrientations : []
  const currentOrientation = String(state.metrics.currentOrientation ?? 'unknown')

  return [
    { label: 'Orientation actuelle', value: currentOrientation },
    { label: 'Positions observees', value: observedOrientations.length > 0 ? observedOrientations.join(', ') : 'aucune' }
  ]
}

const buildRotationStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = state.metrics.supported !== false
  const observedOrientations = Array.isArray(state.metrics.observedOrientations) ? state.metrics.observedOrientations : []
  const hasPortrait = observedOrientations.includes('portrait')
  const hasLandscape = observedOrientations.includes('landscape')

  if (!supported) {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (hasPortrait && hasLandscape && state.userVerdict === 'pass') {
    return 'pass'
  }

  return 'warning'
}

export const useRotationTest = (): DiagnosticTestDefinition => ({
  id: 'rotation',
  name: 'Rotation',
  description: "Verifie que l'interface bascule bien entre portrait et paysage quand le telephone tourne.",
  icon: 'rotate',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'rotation-ui',
        label: "Rotation de l'interface",
        instruction: "Tourne le telephone pour faire apparaitre au moins une vue portrait et une vue paysage.",
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      currentOrientation: 'unknown',
      observedOrientations: []
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildRotationStatus(state)
    const observedOrientations = Array.isArray(state.metrics.observedOrientations) ? state.metrics.observedOrientations : []

    return {
      testId: 'rotation',
      status,
      summary:
        observedOrientations.includes('portrait') && observedOrientations.includes('landscape')
          ? "L'interface a bien bascule entre portrait et paysage pendant le test."
          : "La rotation de l'interface reste incomplete ou incertaine.",
      details: buildRotationDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
