import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const GRID_ROWS = 12
const GRID_COLS = 7
const TOTAL_CELLS = GRID_ROWS * GRID_COLS
const COVERAGE_THRESHOLD = 90

const buildTouchDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const visitedCells = Array.isArray(state.metrics.visitedCellIds) ? state.metrics.visitedCellIds : []
  const coveragePercent = typeof state.metrics.coveragePercent === 'number' ? state.metrics.coveragePercent : 0
  const unvisitedCount = Math.max(0, TOTAL_CELLS - visitedCells.length)
  const completedAutomatically = Boolean(state.metrics.completedAutomatically)

  return [
    {
      label: 'Couverture',
      value: `${coveragePercent}% (${visitedCells.length}/${TOTAL_CELLS})`,
      status: coveragePercent >= COVERAGE_THRESHOLD ? 'pass' : 'warning'
    },
    {
      label: 'Cellules manquantes',
      value: String(unvisitedCount),
      status: unvisitedCount === 0 ? 'pass' : 'warning'
    },
    {
      label: 'Mode de fin',
      value: completedAutomatically ? 'automatique' : 'geste 5 taps',
      status: 'pass'
    }
  ]
}

const buildTouchStatus = (state: DiagnosticGuidedState): TestStatus => {
  const coveragePercent = typeof state.metrics.coveragePercent === 'number' ? state.metrics.coveragePercent : 0

  if (coveragePercent === 0) {
    return 'failed'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (coveragePercent < COVERAGE_THRESHOLD || state.userVerdict === 'warning') {
    return 'warning'
  }

  return 'pass'
}

export const useTouchTest = (): DiagnosticTestDefinition => ({
  id: 'touch',
  name: 'Tactile',
  description: 'Cartographie toute la surface tactile avec une grille fine et une fin auto ou par geste 5 taps.',
  icon: 'grid',
  mode: 'guided',
  immersive: true,
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'touch-grid',
        label: 'Grille tactile',
        instruction: "Balaye toute la surface de l'ecran jusqu'a la couverture cible ou quitte par 5 taps rapides.",
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      rows: GRID_ROWS,
      cols: GRID_COLS,
      totalCells: TOTAL_CELLS,
      visitedCellIds: [],
      coveragePercent: 0,
      completedAutomatically: false,
      completedByGesture: false
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildTouchStatus(state)

    return {
      testId: 'touch',
      status,
      summary:
        status === 'pass'
          ? 'La grille tactile a ete largement couverte sans zone morte signalee.'
          : 'Le controle tactile revele une couverture incomplete ou un doute utilisateur.',
      details: buildTouchDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
