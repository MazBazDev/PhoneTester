import { describe, expect, it } from 'vitest'
import { useAutofocusTest } from './useAutofocusTest'

describe('useAutofocusTest', () => {
  it('returns pass when near and far stages are validated and user confirms', () => {
    const definition = useAutofocusTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('autofocus test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.streamOpened = true
    state.metrics.activeDeviceLabel = 'Back Camera'
    state.metrics.nearValidated = true
    state.metrics.farValidated = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[2]?.value).toBe('validee')
    expect(result.details[3]?.value).toBe('validee')
  })
})
