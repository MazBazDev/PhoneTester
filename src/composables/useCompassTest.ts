import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildCompassDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const heading = typeof state.metrics.heading === 'number' ? `${Math.round(state.metrics.heading)}°` : 'indisponible'
  const headingDetected = Boolean(state.metrics.headingDetected)
  const cardinal = String(state.metrics.cardinal ?? 'inconnue')

  return [
    { label: 'Permission mouvement', value: permissionState },
    { label: 'Cap detecte', value: heading },
    { label: 'Nord interpretable', value: headingDetected ? 'oui' : 'non' },
    { label: 'Orientation cardinale', value: cardinal }
  ]
}

const buildCompassStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const headingDetected = Boolean(state.metrics.headingDetected)

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

  return headingDetected ? 'pass' : 'warning'
}

export const useCompassTest = (): DiagnosticTestDefinition => ({
  id: 'compass',
  name: 'Boussole',
  description: 'Affiche un compas oriente vers le nord quand le cap est exploitable.',
  icon: 'compass',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'compass-live',
        label: 'Compas live',
        instruction: 'Fais pivoter doucement le telephone pour verifier que le nord reste coherent.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      heading: null,
      headingDetected: false,
      cardinal: 'inconnue',
      alpha: 0,
      beta: 0,
      gamma: 0
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildCompassStatus(state)
    const headingDetected = Boolean(state.metrics.headingDetected)

    return {
      testId: 'compass',
      status,
      summary: headingDetected
        ? 'Un cap nord exploitable a ete detecte pendant le test.'
        : 'La boussole n’a pas fourni de cap exploitable ou reste incertaine.',
      details: buildCompassDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
