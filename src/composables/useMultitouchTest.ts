import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildMultitouchDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Doigts actifs max', value: String(state.metrics.maxSimultaneousTouches ?? 0) },
  { label: 'Dernier niveau detecte', value: String(state.metrics.activeTouches ?? 0) }
]

const buildMultitouchStatus = (state: DiagnosticGuidedState): TestStatus => {
  const maxTouches = Number(state.metrics.maxSimultaneousTouches ?? 0)

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (maxTouches <= 0) {
    return 'failed'
  }

  if (state.userVerdict === 'warning') {
    return 'warning'
  }

  return maxTouches >= 3 ? 'pass' : 'warning'
}

export const useMultitouchTest = (): DiagnosticTestDefinition => ({
  id: 'multitouch',
  name: 'Multitouch',
  description: 'Compte le nombre de doigts simultanes detectes sur une zone dediee.',
  icon: 'touchpoints',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'multitouch-live',
        label: 'Multitouch live',
        instruction: 'Pose 2 puis 3 doigts en meme temps pour verifier la detection simultanee.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      activeTouches: 0,
      maxSimultaneousTouches: 0
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'multitouch',
    status: buildMultitouchStatus(state),
    summary:
      buildMultitouchStatus(state) === 'pass'
        ? 'La detection de plusieurs doigts simultanes a bien reagi.'
        : 'Le test multitouch reste partiel, douteux ou insuffisant.',
    details: buildMultitouchDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
