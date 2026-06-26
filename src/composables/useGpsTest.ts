import type {
  DiagnosticGuidedState,
  DiagnosticTestDefinition,
  DiagnosticTestDetail,
  DiagnosticTestRunResult,
  TestStatus
} from '../domain/diagnostic'

const formatCoordinate = (value: unknown) =>
  typeof value === 'number' ? value.toFixed(6) : 'indisponible'

const formatMetric = (value: unknown, unit: string) =>
  typeof value === 'number' ? `${value.toFixed(1)} ${unit}` : 'indisponible'

const buildGpsDetails = (state: DiagnosticGuidedState): DiagnosticTestDetail[] => {
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const latitude = formatCoordinate(state.metrics.latitude)
  const longitude = formatCoordinate(state.metrics.longitude)
  const accuracy = formatMetric(state.metrics.accuracy, 'm')
  const altitude = formatMetric(state.metrics.altitude, 'm')
  const speed = formatMetric(state.metrics.speed, 'm/s')
  const acquiredInMs = typeof state.metrics.acquiredInMs === 'number' ? `${Math.round(state.metrics.acquiredInMs)} ms` : 'indisponible'

  return [
    { label: 'Permission localisation', value: permissionState },
    { label: 'Latitude', value: latitude },
    { label: 'Longitude', value: longitude },
    { label: 'Precision', value: accuracy },
    { label: 'Altitude', value: altitude },
    { label: 'Vitesse', value: speed },
    { label: 'Temps acquisition', value: acquiredInMs }
  ]
}

const buildGpsStatus = (state: DiagnosticGuidedState): TestStatus => {
  const supported = Boolean(state.metrics.supported)
  const permissionState = String(state.metrics.permissionState ?? 'unknown')
  const acquired = Boolean(state.metrics.acquired)

  if (!supported || permissionState === 'not_supported') {
    return 'not_supported'
  }

  if (state.userVerdict === 'failed') {
    return 'failed'
  }

  if (!acquired && permissionState === 'denied') {
    return 'warning'
  }

  if (acquired && state.userVerdict === 'pass') {
    return 'pass'
  }

  return acquired ? 'warning' : 'failed'
}

export const useGpsTest = (): DiagnosticTestDefinition => ({
  id: 'gps',
  name: 'GPS',
  description: 'Acquiert une position et affiche precision, altitude, vitesse et temps d’acquisition.',
  icon: 'map-pin',
  mode: 'guided',
  createGuidedState: () => ({
    phase: 'idle',
    startedAt: null,
    currentStepIndex: 0,
    steps: [
      {
        id: 'gps-live',
        label: 'Acquisition GPS',
        instruction: 'Attends une position, puis verifie si les mesures paraissent coherentes.',
        status: 'pending',
        response: null
      }
    ],
    metrics: {
      supported: true,
      permissionState: 'unknown',
      acquired: false,
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      speed: null,
      acquiredInMs: null,
      acquisitionError: null
    },
    userVerdict: null
  }),
  finalizeGuidedResult: (state: DiagnosticGuidedState): DiagnosticTestRunResult => {
    const status = buildGpsStatus(state)
    const acquired = Boolean(state.metrics.acquired)

    return {
      testId: 'gps',
      status,
      summary: acquired
        ? 'Une position exploitable a ete acquise pendant le test GPS.'
        : 'Aucune position exploitable n’a ete obtenue pendant le test GPS.',
      details: buildGpsDetails(state),
      startedAt: state.startedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  }
})
