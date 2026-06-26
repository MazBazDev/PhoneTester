import { describe, expect, it } from 'vitest'
import { useGyroscopeTest } from './useGyroscopeTest'

describe('useGyroscopeTest', () => {
  it('returns pass when rotation rate is detected', () => {
    const definition = useGyroscopeTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('gyroscope test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.maxAbsAlpha = 18
    state.metrics.maxAbsBeta = 9
    state.metrics.maxAbsGamma = 26
    state.metrics.variationDetected = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[4]?.value).toBe('oui')
  })
})
