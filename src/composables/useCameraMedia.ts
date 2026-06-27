import { ref } from 'vue'

export type MediaPermissionState = 'unknown' | 'granted' | 'denied' | 'not_supported'

export interface CameraDeviceInfo {
  deviceId: string
  label: string
  facing: 'front' | 'rear' | 'unknown'
}

const isBrowser = () => typeof window !== 'undefined'

const detectFacing = (label: string): CameraDeviceInfo['facing'] => {
  const normalized = label.toLowerCase()

  if (normalized.includes('front') || normalized.includes('facetime') || normalized.includes('user')) {
    return 'front'
  }

  if (
    normalized.includes('back') ||
    normalized.includes('rear') ||
    normalized.includes('environment') ||
    normalized.includes('wide') ||
    normalized.includes('tele') ||
    normalized.includes('ultra')
  ) {
    return 'rear'
  }

  return 'unknown'
}

export const useCameraMedia = () => {
  const supported = ref(true)
  const permissionState = ref<MediaPermissionState>('unknown')
  const activeStream = ref<MediaStream | null>(null)
  const availableVideoDevices = ref<CameraDeviceInfo[]>([])
  const activeDeviceId = ref<string | null>(null)
  const activeDeviceLabel = ref<string>('inconnue')
  const streamActive = ref(false)
  const captureDataUrl = ref<string | null>(null)

  const stopStream = () => {
    activeStream.value?.getTracks().forEach((track) => track.stop())
    activeStream.value = null
    streamActive.value = false
  }

  const listVideoDevices = async () => {
    if (!isBrowser() || !navigator.mediaDevices?.enumerateDevices) {
      availableVideoDevices.value = []
      return []
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || 'Camera inconnue',
        facing: detectFacing(device.label || '')
      }))

    availableVideoDevices.value = videoDevices
    return videoDevices
  }

  const requestPermission = async (): Promise<MediaPermissionState> => {
    if (!isBrowser() || !navigator.mediaDevices?.getUserMedia) {
      supported.value = false
      permissionState.value = 'not_supported'
      return 'not_supported'
    }

    supported.value = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      permissionState.value = 'granted'
      stopStream()
      activeStream.value = stream
      stream.getTracks().forEach((track) => track.stop())
      activeStream.value = null
      await listVideoDevices()
      return 'granted'
    } catch {
      permissionState.value = 'denied'
      return 'denied'
    }
  }

  const resolveConstraints = (options: { facingMode?: 'user' | 'environment'; deviceId?: string }) => {
    if (options.deviceId) {
      return {
        video: {
          deviceId: {
            exact: options.deviceId
          }
        },
        audio: false
      } satisfies MediaStreamConstraints
    }

    return {
      video: {
        facingMode: {
          ideal: options.facingMode ?? 'environment'
        }
      },
      audio: false
    } satisfies MediaStreamConstraints
  }

  const startStream = async (options: { facingMode?: 'user' | 'environment'; deviceId?: string }) => {
    if (!isBrowser() || !navigator.mediaDevices?.getUserMedia) {
      supported.value = false
      permissionState.value = 'not_supported'
      return null
    }

    stopStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia(resolveConstraints(options))
      activeStream.value = stream
      streamActive.value = true
      permissionState.value = 'granted'

      const track = stream.getVideoTracks()[0]
      const settings = track?.getSettings()

      await listVideoDevices()

      const fallbackDevice =
        options.deviceId
          ? availableVideoDevices.value.find((device) => device.deviceId === options.deviceId) ?? null
          : options.facingMode
            ? availableVideoDevices.value.find((device) =>
                options.facingMode === 'user' ? device.facing === 'front' : device.facing === 'rear'
              ) ?? null
            : availableVideoDevices.value[0] ?? null

      activeDeviceId.value = settings?.deviceId ?? options.deviceId ?? fallbackDevice?.deviceId ?? null

      const activeDevice = availableVideoDevices.value.find((device) => device.deviceId === activeDeviceId.value)
      activeDeviceLabel.value =
        activeDevice?.label ??
        (options.facingMode === 'user' ? 'Camera avant' : 'Camera arriere')

      return stream
    } catch {
      streamActive.value = false
      permissionState.value = 'denied'
      return null
    }
  }

  const switchDevice = async (deviceId: string) => startStream({ deviceId })

  const captureFrame = (videoElement: HTMLVideoElement | null) => {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    captureDataUrl.value = dataUrl

    return dataUrl
  }

  return {
    activeDeviceId,
    activeDeviceLabel,
    activeStream,
    availableVideoDevices,
    captureDataUrl,
    listVideoDevices,
    permissionState,
    requestPermission,
    startStream,
    stopStream,
    streamActive,
    supported,
    switchDevice,
    captureFrame
  }
}
