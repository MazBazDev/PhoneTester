import { describe, expect, it } from 'vitest'
import { useMicrophoneTest } from './useMicrophoneTest'

describe('useMicrophoneTest', () => {
  it('returns pass when audio stream and sound detection succeed', () => {
    const definition = useMicrophoneTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('microphone test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'granted'
    state.metrics.streamOpened = true
    state.metrics.peakLevel = 0.42
    state.metrics.soundDetected = true
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('pass')
    expect(result.details[2]?.value).toBe('42%')
  })

  it('returns warning when microphone permission is denied', () => {
    const definition = useMicrophoneTest()
    const state = definition.createGuidedState?.()

    if (!state || !definition.finalizeGuidedResult) {
      throw new Error('microphone test unavailable')
    }

    state.startedAt = '2025-01-01T00:00:00.000Z'
    state.metrics.supported = true
    state.metrics.permissionState = 'denied'
    state.metrics.streamOpened = false
    state.metrics.soundDetected = false
    state.userVerdict = 'pass'

    const result = definition.finalizeGuidedResult(state)

    expect(result.status).toBe('warning')
  })
})
