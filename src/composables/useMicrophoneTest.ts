import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const buildMicrophoneDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => [
  { label: 'Permission micro', value: String(state.metrics.permissionState ?? 'unknown') },
  { label: 'Flux audio', value: Boolean(state.metrics.streamOpened) ? 'actif' : 'inactif' },
  { label: 'Pic detecte', value: `${Math.round(Number(state.metrics.peakLevel ?? 0) * 100)}%` },
  { label: 'Son detecte', value: Boolean(state.metrics.soundDetected) ? 'oui' : 'non' }
]

const buildMicrophoneStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const streamOpened = Boolean(state.metrics.streamOpened)
  const soundDetected = Boolean(state.metrics.soundDetected)

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (permissionState === 'denied' || !streamOpened) {
    return 'warning'
  }

  if (state.userVerdict === 'warning') {
    return 'warning'
  }

  return soundDetected ? 'pass' : 'warning'
}

export const useMicrophoneTest = (): DiagnosticTestDefinition => ({
  id: 'microphone',
  name: 'Microphone',
  description: 'Ouvre le micro, affiche un signal live et laisse une validation manuelle apres verification.',
  icon: 'microphone',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'microphone-live',
        label: 'Micro live',
        instruction: 'Parle, souffle ou tapote pres du micro pour verifier que le niveau audio reagit.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      streamOpened: false,
      level: 0,
      peakLevel: 0,
      soundDetected: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => ({
    testId: 'microphone',
    status: buildMicrophoneStatus(state),
    summary:
      buildMicrophoneStatus(state) === 'pass'
        ? 'Le microphone a bien capte un signal exploitable.'
        : 'Le test microphone reste partiel, douteux ou a echoue.',
    details: buildMicrophoneDetails(state),
    startedAt: state.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString()
  })
})
