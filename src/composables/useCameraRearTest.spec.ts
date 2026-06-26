import { describe, expect, it } from 'vitest'
import { useCameraRearTest } from './useCameraRearTest'

describe('useCameraRearTest', () => {
  it('returns pass when stream, capture and user validation succeed', () => {
    const definition = useCameraRearTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('rear camera test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.streamOpened = true
    state.metrics.activeDeviceLabel = 'Back Camera'
    state.metrics.availableDeviceCount = 3
    state.metrics.captureSucceeded = true
    state.metrics.capturePreviewAvailable = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[3]?.previewKey).toBe('rear-preview')
  })
})
