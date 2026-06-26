import { ref } from 'vue'

export type MicrophonePermissionState = 'unknown' | 'granted' | 'denied' | 'not_supported'

const isBrowser = () => typeof window !== 'undefined'

export const useMicrophoneLevel = () => {
  const supported = ref(true)
  const permissionState = ref<MicrophonePermissionState>('unknown')
  const activeStream = ref<MediaStream | null>(null)
  const level = ref(0)
  const peakLevel = ref(0)
  const soundDetected = ref(false)

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrameId: number | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let dataArray: Uint8Array<ArrayBuffer> | null = null

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
  }

  const tickLevel = () => {
    if (!analyser || !dataArray) {
      return
    }

    analyser.getByteTimeDomainData(dataArray)

    let sum = 0
    for (const value of dataArray) {
      const normalized = (value - 128) / 128
      sum += normalized * normalized
    }

    const rms = Math.sqrt(sum / dataArray.length)
    const nextLevel = Math.min(1, rms * 4.5)
    level.value = nextLevel
    peakLevel.value = Math.max(peakLevel.value, nextLevel)

    if (nextLevel >= 0.12) {
      soundDetected.value = true
    }

    animationFrameId = requestAnimationFrame(tickLevel)
  }

  const requestPermission = async (): Promise<MicrophonePermissionState> => {
    if (!isBrowser() || !navigator.mediaDevices?.getUserMedia) {
      supported.value = false
      permissionState.value = 'not_supported'
      return 'not_supported'
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })

      permissionState.value = 'granted'
      stream.getTracks().forEach((track) => track.stop())
      return 'granted'
    } catch {
      permissionState.value = 'denied'
      return 'denied'
    }
  }

  const startStream = async () => {
    if (!isBrowser() || !navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
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

      audioContext = new window.AudioContext()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      dataArray = new Uint8Array(new ArrayBuffer(analyser.fftSize))
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
    requestPermission,
    soundDetected,
    startStream,
    stopStream,
    supported
  }
}
