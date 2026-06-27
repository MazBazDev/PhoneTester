import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildAutofocusDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Permission camera', value: String(state.metrics.permissionState ?? 'unknown') },
  { label: 'Camera active', value: String(state.metrics.activeDeviceLabel ?? 'inconnue') },
  { label: 'Etape proche', value: Boolean(state.metrics.nearValidated) ? 'validee' : 'non validee' },
  { label: 'Etape loin', value: Boolean(state.metrics.farValidated) ? 'validee' : 'non validee' }
]

const buildAutofocusStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const streamOpened = Boolean(state.metrics.streamOpened)
  const nearValidated = Boolean(state.metrics.nearValidated)
  const farValidated = Boolean(state.metrics.farValidated)

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

  return nearValidated && farValidated ? 'pass' : 'warning'
}

export const useAutofocusTest = (): DiagnosticTestDefinition => ({
  id: 'autofocus',
  name: 'Autofocus',
  description: 'Guide une verification proche puis loin sur le flux arriere avec une cible visuelle.',
  icon: 'focus',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'autofocus-near',
        label: 'Approche ta main',
        instruction: 'Place ta main ou un objet tres pres de la cible et observe si la mise au point suit.',
        status: 'pending',
        response: null
      },
      {
        id: 'autofocus-far',
        label: 'Eloigne ta main',
        instruction: 'Eloigne l’objet ou ta main pour verifier que la mise au point revient correctement.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      streamOpened: false,
      activeDeviceLabel: 'inconnue',
      nearValidated: false,
      farValidated: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'autofocus',
    status: buildAutofocusStatus(state),
    summary:
      buildAutofocusStatus(state) === 'pass'
        ? 'La mise au point a suivi correctement le parcours proche puis loin.'
        : 'Le test autofocus reste partiel, douteux ou a echoue.',
    details: buildAutofocusDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
