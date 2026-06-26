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
    state.metrics.currentTilt = 'right'
    state.metrics.observedTilts = ['left', 'right', 'up', 'down']
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[1]?.value).toContain('droite')
  })

  it('returns warning when the test is partial', () => {
    const definition = useAccelerometerTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('accelerometer test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.currentTilt = 'left'
    state.metrics.observedTilts = ['left', 'up']
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
  })
})
