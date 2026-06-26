import { describe, expect, it } from 'vitest'
import { useCompassTest } from './useCompassTest'

describe('useCompassTest', () => {
  it('returns pass when heading is detected and user confirms', () => {
    const definition = useCompassTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('compass test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.heading = 17
    state.metrics.headingDetected = true
    state.metrics.cardinal = 'nord'
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[1]?.value).toContain('17')
  })
})
