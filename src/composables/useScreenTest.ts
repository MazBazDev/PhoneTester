import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const screenSteps = [
  {
    id: 'white',
    label: 'Blanc',
    instruction: 'Observe les pixels, la luminosite et les halos sur fond blanc.',
    color: '#ffffff',
    tone: 'text-slate-900'
  },
  {
    id: 'black',
    label: 'Noir',
    instruction: 'Repere les fuites de lumiere et les zones grises sur fond noir.',
    color: '#020617',
    tone: 'text-white'
  },
  {
    id: 'red',
    label: 'Rouge',
    instruction: 'Verifie l’uniformite du rouge et l’absence de taches.',
    color: '#dc2626',
    tone: 'text-white'
  },
  {
    id: 'green',
    label: 'Vert',
    instruction: 'Verifie l’uniformite du vert sur toute la dalle.',
    color: '#16a34a',
    tone: 'text-white'
  },
  {
    id: 'blue',
    label: 'Bleu',
    instruction: 'Repere les zones ternes ou les pixels non allumes.',
    color: '#2563eb',
    tone: 'text-white'
  },
  {
    id: 'gray',
    label: 'Gris',
    instruction: 'Cherche les bandings, halos ou differences de teinte.',
    color: '#94a3b8',
    tone: 'text-slate-950'
  },
  {
    id: 'color-gradient',
    label: 'Degrade couleurs',
    instruction: 'Observe le passage progressif d’une couleur a l’autre. La transition doit rester fluide sur tout l’ecran.',
    color: '#7c3aed',
    tone: 'text-white',
    animationName: 'screen-color-shift',
    animationDuration: '18s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate'
  },
  {
    id: 'dark-gradient',
    label: 'Nuances noir blanc',
    instruction: 'Observe le passage continu du blanc vers le noir. La transition doit rester fluide, sans marche visible.',
    color: '#ffffff',
    tone: 'text-slate-950',
    animationName: 'screen-dark-shift',
    animationDuration: '28s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate'
  }
] as const

const getFlaggedStepIds = (state: DiagnosticGuidedState) =>
  Array.isArray(state.metrics.flaggedStepIds) ? (state.metrics.flaggedStepIds as string[]) : []

const isStepFlagged = (state: DiagnosticGuidedState, stepId: string) => getFlaggedStepIds(state).includes(stepId)

const getDefectCount = (state: DiagnosticGuidedState) => getFlaggedStepIds(state).length

const buildDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] =>
  state.steps.map((step) => ({
    label: step.label,
    value: isStepFlagged(state, step.id) ? 'doute signale' : 'rien signale',
    status: isStepFlagged(state, step.id) ? 'warning' : 'pass'
  }))

const buildStatus = (state: DiagnosticGuidedState): TestStatus => {
  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (state.userVerdict === 'warning' || getDefectCount(state) > 0) {
    return 'warning'
  }

  return 'pass'
}

export const useScreenTest = (): DiagnosticTestDefinition => ({
  id: 'screen',
  name: 'Ecran',
  description: 'Affiche des aplats et des degrades plein cadre pour verifier rapidement la dalle.',
  icon: 'palette',
  mode: 'guided',
  immersive: true,
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: screenSteps.map((step) => ({
      ...step,
      status: 'pending',
      response: null
    })),
    metrics: {
      flaggedStepIds: []
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const defectCount = getDefectCount(state)
    const status = buildStatus(state)

    return {
      testId: 'screen',
      status,
      summary:
        defectCount === 0 && state.userVerdict !== 'warning'
          ? 'Aucun defaut visuel n’a ete signale sur les aplats et degrades affiches.'
          : `${defectCount} ecran(s) de verification ont revele un doute ou un defaut visuel.`,
      details: buildDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
