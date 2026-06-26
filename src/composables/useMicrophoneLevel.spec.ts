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
  })
})
