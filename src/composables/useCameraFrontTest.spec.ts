import { describe, expect, it } from 'vitest'
import { useCameraFrontTest } from './useCameraFrontTest'

describe('useCameraFrontTest', () => {
  it('returns warning when capture is missing despite an opened stream', () => {
    const definition = useCameraFrontTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('front camera test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.streamOpened = true
    state.metrics.activeDeviceLabel = 'Front Camera'
    state.metrics.captureSucceeded = false
    state.metrics.capturePreviewAvailable = false
    state.userVerdict = 'warning'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
    expect(result.details[2]?.value).toBe('non capturee')
  })
})
