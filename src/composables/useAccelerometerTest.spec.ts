import { describe, expect, it } from 'vitest'
import { useAccelerometerTest } from './useAccelerometerTest'

describe('useAccelerometerTest', () => {
  it('returns pass when variation is detected', () => {
    const definition = useAccelerometerTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('accelerometer test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.maxAbsX = 1.5
    state.metrics.maxAbsY = 2.8
    state.metrics.maxAbsZ = 9.6
    state.metrics.variationDetected = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[4]?.value).toBe('oui')
  })
})
