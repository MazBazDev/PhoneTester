import { describe, expect, it } from 'vitest'
import { useRotationTest } from './useRotationTest'

describe('useRotationTest', () => {
  it('returns pass when portrait and landscape are both observed', () => {
    const definition = useRotationTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('rotation test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.orientationsSeen = ['portrait', 'landscape']
    state.metrics.hasGyroscopeData = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[1]?.value).toContain('landscape')
  })
})
