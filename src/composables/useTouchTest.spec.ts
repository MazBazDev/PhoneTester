import { describe, expect, it } from 'vitest'
import { useTouchTest } from './useTouchTest'

describe('useTouchTest', () => {
  it('returns pass when coverage is high and no dead zone is reported', () => {
    const definition = useTouchTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('guided touch test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.visitedCellIds = Array.from({ length: 38 }, (_, index) => `cell-${index}`)
    state.metrics.coveragePercent = 95
    state.metrics.maxSimultaneousTouches = 3
    state.metrics.deadZonesReported = false
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[0]?.value).toContain('95%')
  })
})
