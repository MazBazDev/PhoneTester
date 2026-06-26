import { describe, expect, it } from 'vitest'
import { useGpsTest } from './useGpsTest'

describe('useGpsTest', () => {
  it('returns pass when a gps fix is acquired and user confirms', () => {
    const definition = useGpsTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('gps test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.acquired = true
    state.metrics.latitude = 48.8566
    state.metrics.longitude = 2.3522
    state.metrics.accuracy = 12.4
    state.metrics.altitude = 32
    state.metrics.speed = 0
    state.metrics.acquiredInMs = 2400
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[1]?.value).toContain('48.856600')
  })
})
