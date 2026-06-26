import { describe, expect, it } from 'vitest'
import { useGyroscopeTest } from './useGyroscopeTest'

describe('useGyroscopeTest', () => {
  it('returns pass when rotation rate is detected', () => {
    const definition = useGyroscopeTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('gyroscope test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.currentAxis = 'gamma'
    state.metrics.observedAxes = ['alpha', 'beta', 'gamma']
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[2]?.value).toContain('alpha')
  })

  it('returns warning when only some axes are observed', () => {
    const definition = useGyroscopeTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('gyroscope test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.currentAxis = 'alpha'
    state.metrics.observedAxes = ['alpha', 'beta']
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
  })
})
