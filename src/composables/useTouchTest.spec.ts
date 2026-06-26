import { describe, expect, it } from 'vitest'
import { useTouchTest } from './useTouchTest'

describe('useTouchTest', () => {
  it('returns pass when coverage is complete and user confirms', () => {
    const definition = useTouchTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('guided touch test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.visitedCellIds = Array.from({ length: 84 }, (_, index) => `cell-${index}`)
    state.metrics.coveragePercent = 100
    state.metrics.completedAutomatically = true
    state.metrics.completedByGesture = false
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[0]?.value).toContain('100%')
    expect(result.details[2]?.value).toBe('automatique')
  })

  it('returns warning when ended by gesture with incomplete coverage', () => {
    const definition = useTouchTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('guided touch test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.visitedCellIds = Array.from({ length: 80 }, (_, index) => `cell-${index}`)
    state.metrics.coveragePercent = 95
    state.metrics.completedAutomatically = false
    state.metrics.completedByGesture = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
    expect(result.details[2]?.value).toBe('geste 5 taps')
  })
})
