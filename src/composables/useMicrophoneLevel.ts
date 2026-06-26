import { ref } from 'vue'

export type MicrophonePermissionState = 'unknown' | 'granted' | 'denied' | 'not_supported'

const WAVEFORM_SAMPLES = 48

const createWaveformBaseline = () => Array.from({ length: WAVEFORM_SAMPLES }, () => 0.5)

const isBrowser = () => typeof window !== 'undefined'

type BrowserAudioContext = typeof AudioContext & {
  new (): AudioContext
}

const getAudioContextCtor = (): BrowserAudioContext | null => {
  if (!isBrowser()) {
    return null
  }

  const candidate = (window.AudioContext ||
    (window as Window & { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext) as BrowserAudioContext | undefined

  return candidate ?? null
}

export const useMicrophoneLevel = () => {
  const supported = ref(true)
  const permissionState = ref<MicrophonePermissionState>('unknown')
  const activeStream = ref<MediaStream | null>(null)
  const level = ref(0)
  const peakLevel = ref(0)
  const soundDetected = ref(false)
  const waveform = ref<number[]>(createWaveformBaseline())

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrameId: number | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let dataArray: Uint8Array | null = null

  const stopStream = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    sourceNode?.disconnect()
    analyser?.disconnect()
    activeStream.value?.getTracks().forEach((track) => track.stop())

    if (audioContext) {
      void audioContext.close().catch(() => undefined)
    }

    sourceNode = null
    analyser = null
    audioContext = null
    dataArray = null
    activeStream.value = null
    level.value = 0
    peakLevel.value = 0
    soundDetected.value = false
    waveform.value = createWaveformBaseline()
  }

  const tickLevel = () => {
    if (!analyser || !dataArray) {
      return
    }

    const nextDataArray = dataArray as Uint8Array<ArrayBuffer>

    analyser.getByteTimeDomainData(nextDataArray)

    let sum = 0
    for (const value of nextDataArray) {
      const normalized = (value - 128) / 128
      sum += normalized * normalized
    }

    const rms = Math.sqrt(sum / nextDataArray.length)
    const nextLevel = Math.min(1, rms * 4.5)
    level.value = nextLevel
    peakLevel.value = Math.max(peakLevel.value, nextLevel)
    waveform.value = Array.from({ length: WAVEFORM_SAMPLES }, (_, index) => {
      const sourceIndex = Math.min(
        nextDataArray.length - 1,
        Math.round((index / Math.max(1, WAVEFORM_SAMPLES - 1)) * (nextDataArray.length - 1))
      )

      return nextDataArray[sourceIndex] / 255
    })

    if (nextLevel >= 0.12) {
      soundDetected.value = true
    }

    animationFrameId = requestAnimationFrame(tickLevel)
  }

  const startStream = async () => {
    const AudioContextCtor = getAudioContextCtor()

    if (!isBrowser() || !navigator.mediaDevices?.getUserMedia || !AudioContextCtor) {
      supported.value = false
      permissionState.value = 'not_supported'
      return null
    }

    stopStream()
    peakLevel.value = 0
    soundDetected.value = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      })

      audioContext = new AudioContextCtor()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      dataArray = new Uint8Array(analyser.fftSize)
      sourceNode = audioContext.createMediaStreamSource(stream)
      sourceNode.connect(analyser)

      activeStream.value = stream
      permissionState.value = 'granted'
      tickLevel()

      return stream
    } catch {
      permissionState.value = 'denied'
      return null
    }
  }

  return {
    activeStream,
    level,
    peakLevel,
    permissionState,
    soundDetected,
    startStream,
    stopStream,
    supported,
    waveform
  }
}
