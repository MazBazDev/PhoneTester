import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const GRID_ROWS = 8
const GRID_COLS = 5
const TOTAL_CELLS = GRID_ROWS * GRID_COLS
const COVERAGE_THRESHOLD = 90

const buildTouchDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const visitedCells = Array.isArray(state.metrics.visitedCellIds) ? state.metrics.visitedCellIds : []
  const coveragePercent = typeof state.metrics.coveragePercent === 'number' ? state.metrics.coveragePercent : 0
  const maxSimultaneousTouches =
    typeof state.metrics.maxSimultaneousTouches === 'number' ? state.metrics.maxSimultaneousTouches : 0
  const deadZonesReported = Boolean(state.metrics.deadZonesReported)

  return [
    {
      label: 'Couverture',
      value: `${coveragePercent}% (${visitedCells.length}/${TOTAL_CELLS})`,
      status: coveragePercent >= COVERAGE_THRESHOLD ? 'pass' : 'warning'
    },
    {
      label: 'Multitouch max',
      value: String(maxSimultaneousTouches),
      status: maxSimultaneousTouches >= 2 ? 'pass' : 'warning'
    },
    {
      label: 'Zones mortes signalees',
      value: deadZonesReported ? 'oui' : 'non',
      status: deadZonesReported ? 'warning' : 'pass'
    }
  ]
}

const buildTouchStatus = (state: DiagnosticGuidedState): TestStatus => {
  const coveragePercent = typeof state.metrics.coveragePercent === 'number' ? state.metrics.coveragePercent : 0
  const deadZonesReported = Boolean(state.metrics.deadZonesReported)

  if (coveragePercent === 0) {
    return 'failed'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (deadZonesReported || coveragePercent < COVERAGE_THRESHOLD || state.userVerdict === 'warning') {
    return 'warning'
  }

  return 'pass'
}

export const useTouchTest = (): DiagnosticTestDefinition => ({
  id: 'touch',
  name: 'Tactile',
  description: 'Colorie une grille entiere et controle le multitouch avant validation finale.',
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
        instruction: 'Balaye toute la surface de l’ecran et essaye avec plusieurs doigts.',
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
      maxSimultaneousTouches: 0,
      deadZonesReported: null
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
