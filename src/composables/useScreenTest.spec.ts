import { describe, expect, it } from 'vitest'
import { useScreenTest } from './useScreenTest'

describe('useScreenTest', () => {
  it('aggregates warning when a color shows a defect', () => {
    const definition = useScreenTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('guided screen test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.steps = state.steps.map((step, index) => ({
      ...step,
      response: index === 1 ? 'yes' : 'no',
      status: 'completed'
    }))
    state.userVerdict = 'warning'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
    expect(result.details).toHaveLength(6)
  })
})
