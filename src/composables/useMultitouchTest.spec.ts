import { describe, expect, it } from 'vitest'
import { useMultitouchTest } from './useMultitouchTest'

describe('useMultitouchTest', () => {
  it('returns pass when three fingers are detected and user confirms', () => {
    const definition = useMultitouchTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('multitouch test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.activeTouches = 0
    state.metrics.maxSimultaneousTouches = 3
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[0]?.value).toBe('3')
  })
})
