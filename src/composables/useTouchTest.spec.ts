import { describe, expect, it } from 'vitest'
import { useTouchTest } from './useTouchTest'

describe('useTouchTest', () => {
  it('returns pass when coverage is high and user confirms', () => {
    const definition = useTouchTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('guided touch test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.visitedCellIds = Array.from({ length: 76 }, (_, index) => `cell-${index}`)
    state.metrics.coveragePercent = 95
    state.metrics.completedAutomatically = true
    state.metrics.completedByGesture = false
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[0]?.value).toContain('95%')
    expect(result.details[2]?.value).toBe('automatique')
  })
})
