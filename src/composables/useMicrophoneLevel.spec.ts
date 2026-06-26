import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMicrophoneLevel } from './useMicrophoneLevel'

describe('useMicrophoneLevel', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts the stream with webkitAudioContext fallback', async () => {
    const stop = vi.fn()
    const stream = {
      getTracks: () => [{ stop }]
    } as unknown as MediaStream

    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => array.fill(128)),
      disconnect: vi.fn()
    } as unknown as AnalyserNode

    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as MediaStreamAudioSourceNode

    class FakeAudioContext {
      state: AudioContextState = 'running'
      createAnalyser() {
        return analyser
      }
      createMediaStreamSource() {
        return sourceNode
      }
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
    }

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream)
      }
    })

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: FakeAudioContext
    })

    const microphone = useMicrophoneLevel()
    const result = await microphone.startStream()

    expect(result).toBe(stream)
    expect(microphone.permissionState.value).toBe('granted')
    expect(microphone.activeStream.value).toStrictEqual(stream)
    expect(microphone.waveform.value).toHaveLength(48)
    expect(microphone.waveform.value.every((sample) => Math.abs(sample - 0.5) < 0.01)).toBe(true)
  })

  it('updates and resets waveform samples across the stream lifecycle', async () => {
    const stop = vi.fn()
    const stream = {
      getTracks: () => [{ stop }]
    } as unknown as MediaStream

    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => {
        array.forEach((_, index) => {
          array[index] = index % 2 === 0 ? 96 : 160
        })
      }),
      disconnect: vi.fn()
    } as unknown as AnalyserNode

    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as MediaStreamAudioSourceNode

    class FakeAudioContext {
      state: AudioContextState = 'running'
      createAnalyser() {
        return analyser
      }
      createMediaStreamSource() {
        return sourceNode
      }
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
    }

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream)
      }
    })
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext
    })

    const microphone = useMicrophoneLevel()
    await microphone.startStream()

    expect(microphone.level.value).toBeGreaterThan(0)
    expect(microphone.soundDetected.value).toBe(true)
    expect(microphone.waveform.value.some((sample) => sample !== 0.5)).toBe(true)

    microphone.stopStream()

    expect(microphone.level.value).toBe(0)
    expect(microphone.peakLevel.value).toBe(0)
    expect(microphone.soundDetected.value).toBe(false)
    expect(microphone.waveform.value.every((sample) => sample === 0.5)).toBe(true)
  })
})
