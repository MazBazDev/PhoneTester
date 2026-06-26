import { ref } from 'vue'

export type MotionPermissionState = 'unknown' | 'granted' | 'denied' | 'not_supported'

export type SensorMode = 'rotation' | 'accelerometer' | 'gyroscope' | 'compass' | 'gps'

export interface RotationSample {
  orientation: string
  alpha: number
  beta: number
  gamma: number
  hasGyroscopeData: boolean
}

export interface AccelerometerSample {
  x: number
  y: number
  z: number
}

export interface GyroscopeSample {
  alpha: number
  beta: number
  gamma: number
}

export interface CompassSample {
  heading: number | null
  alpha: number
  beta: number
  gamma: number
  hasHeading: boolean
}

export interface GpsSample {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  speed: number | null
  acquiredInMs: number
}

export interface SensorError {
  code: 'permission_denied' | 'timeout' | 'unavailable' | 'unknown'
  message: string
}

const isBrowser = () => typeof window !== 'undefined'

const getOrientationKind = () => {
  if (!isBrowser()) {
    return 'unknown'
  }

  const type = window.screen.orientation?.type
  const legacyOrientation =
    typeof (window as Window & { orientation?: number }).orientation === 'number'
      ? Number((window as Window & { orientation?: number }).orientation)
      : null

  if (type?.startsWith('portrait')) {
    return 'portrait'
  }

  if (type?.startsWith('landscape')) {
    return 'landscape'
  }

  if (legacyOrientation !== null) {
    return Math.abs(legacyOrientation) === 90 ? 'landscape' : 'portrait'
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

const getOrientationAngle = () => {
  if (!isBrowser()) {
    return 0
  }

  const screenAngle = window.screen.orientation?.angle

  if (typeof screenAngle === 'number') {
    return screenAngle
  }

  const legacyOrientation = (window as Window & { orientation?: number }).orientation

  if (typeof legacyOrientation === 'number') {
    return legacyOrientation
  }

  return getOrientationKind() === 'landscape' ? 90 : 0
}

const getHeadingFromOrientationEvent = (event: DeviceOrientationEvent) => {
  const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading

  if (typeof webkitHeading === 'number') {
    return ((webkitHeading % 360) + 360) % 360
  }

  if (typeof event.alpha === 'number') {
    return ((360 - event.alpha) % 360 + 360) % 360
  }

  return null
}

const hasSensorSupport = (mode: SensorMode) => {
  if (!isBrowser()) {
    return false
  }

  if (mode === 'gps') {
    return 'geolocation' in navigator
  }

  if (mode === 'rotation' || mode === 'compass') {
    return (
      'DeviceOrientationEvent' in window ||
      'ondeviceorientation' in window ||
      'ondeviceorientationabsolute' in window ||
      'onorientationchange' in window ||
      'orientation' in screen
    )
  }

  if (mode === 'accelerometer') {
    return (
      'DeviceMotionEvent' in window ||
      'ondevicemotion' in window ||
      'DeviceOrientationEvent' in window ||
      'ondeviceorientation' in window
    )
  }

  return 'DeviceMotionEvent' in window || 'ondevicemotion' in window
}

const getDeviceMotionCtor = () =>
  (window.DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }) ?? null

const getDeviceOrientationCtor = () =>
  (window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>
  }) ?? null

export const useMotionSensors = () => {
  const supported = ref(true)
  const permissionState = ref<MotionPermissionState>('unknown')
  const rotationSample = ref<RotationSample>({
    orientation: getOrientationKind(),
    alpha: 0,
    beta: 0,
    gamma: 0,
    hasGyroscopeData: false
  })
  const accelerometerSample = ref<AccelerometerSample>({
    x: 0,
    y: 0,
    z: 0
  })
  const gyroscopeSample = ref<GyroscopeSample>({
    alpha: 0,
    beta: 0,
    gamma: 0
  })
  const compassSample = ref<CompassSample>({
    heading: null,
    alpha: 0,
    beta: 0,
    gamma: 0,
    hasHeading: false
  })
  const gpsSample = ref<GpsSample | null>(null)

  const cleanups: Array<() => void> = []

  const stopListening = () => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
  }

  const requestPermission = async (mode: SensorMode): Promise<MotionPermissionState> => {
    if (!hasSensorSupport(mode)) {
      supported.value = false
      permissionState.value = 'not_supported'
      return 'not_supported'
    }

    supported.value = true

    if (mode === 'gps') {
      if ('permissions' in navigator && navigator.permissions?.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })

          if (result.state === 'granted') {
            permissionState.value = 'granted'
            return 'granted'
          }

          if (result.state === 'denied') {
            permissionState.value = 'denied'
            return 'denied'
          }
        } catch {
          permissionState.value = 'unknown'
        }
      }

      permissionState.value = 'unknown'
      return 'unknown'
    }

    const requests: Array<() => Promise<'granted' | 'denied'>> = []
    const motionCtor = getDeviceMotionCtor()
    const orientationCtor = getDeviceOrientationCtor()

    if ((mode === 'accelerometer' || mode === 'gyroscope') && motionCtor && typeof motionCtor.requestPermission === 'function') {
      requests.push(() => motionCtor.requestPermission!())
    }

    if (mode === 'accelerometer' && orientationCtor && typeof orientationCtor.requestPermission === 'function') {
      requests.push(() => orientationCtor.requestPermission!())
    }

    if ((mode === 'rotation' || mode === 'compass') && orientationCtor && typeof orientationCtor.requestPermission === 'function') {
      requests.push(() => orientationCtor.requestPermission!())
    }

    if (requests.length === 0) {
      permissionState.value = 'granted'
      return 'granted'
    }

    try {
      const results = await Promise.all(requests.map((request) => request()))
      const nextState = results.every((result) => result === 'granted') ? 'granted' : 'denied'
      permissionState.value = nextState
      return nextState
    } catch {
      permissionState.value = 'denied'
      return 'denied'
    }
  }

  const startListening = (
    mode: SensorMode,
    onSample: (sample: RotationSample | AccelerometerSample | GyroscopeSample | CompassSample | GpsSample) => void,
    onError?: (error: SensorError) => void
  ) => {
    stopListening()

    if (!hasSensorSupport(mode)) {
      supported.value = false
      permissionState.value = 'not_supported'
      onError?.({
        code: 'unavailable',
        message: 'Capteur indisponible sur ce navigateur.'
      })
      return
    }

    supported.value = true

    if (mode === 'rotation') {
      const emitOrientation = () => {
        const angle = getOrientationAngle()
        const sample = {
          orientation: getOrientationKind(),
          alpha: angle,
          beta: angle === 180 ? 180 : 0,
          gamma: Math.abs(angle) === 90 ? angle : 0,
          hasGyroscopeData: rotationSample.value.hasGyroscopeData || angle !== 0
        }

        rotationSample.value = sample
        onSample(sample)
      }

      const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
        const sample = {
          orientation: getOrientationKind(),
          alpha: event.alpha ?? 0,
          beta: event.beta ?? 0,
          gamma: event.gamma ?? 0,
          hasGyroscopeData: true
        }

        rotationSample.value = sample
        onSample(sample)
      }

      emitOrientation()
      window.addEventListener('orientationchange', emitOrientation)
      cleanups.push(() => window.removeEventListener('orientationchange', emitOrientation))
      window.addEventListener('resize', emitOrientation)
      cleanups.push(() => window.removeEventListener('resize', emitOrientation))

      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleDeviceOrientation)
        cleanups.push(() => window.removeEventListener('deviceorientation', handleDeviceOrientation))
      }

      return
    }

    if (mode === 'compass') {
      const handleCompass = (event: DeviceOrientationEvent) => {
        const heading = getHeadingFromOrientationEvent(event)
        const sample = {
          heading,
          alpha: event.alpha ?? 0,
          beta: event.beta ?? 0,
          gamma: event.gamma ?? 0,
          hasHeading: heading !== null
        }

        compassSample.value = sample
        onSample(sample)
      }

      if ('DeviceOrientationEvent' in window || 'ondeviceorientation' in window) {
        window.addEventListener('deviceorientation', handleCompass)
        cleanups.push(() => window.removeEventListener('deviceorientation', handleCompass))
      }

      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleCompass as EventListener)
        cleanups.push(() => window.removeEventListener('deviceorientationabsolute', handleCompass as EventListener))
      }

      return
    }

    if (mode === 'gps') {
      const startedAt = Date.now()

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          permissionState.value = 'granted'

          const sample = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            acquiredInMs: Date.now() - startedAt
          }

          gpsSample.value = sample
          onSample(sample)
        },
        (error) => {
          permissionState.value = error.code === error.PERMISSION_DENIED ? 'denied' : 'unknown'

          onError?.({
            code:
              error.code === error.PERMISSION_DENIED
                ? 'permission_denied'
                : error.code === error.TIMEOUT
                  ? 'timeout'
                  : error.code === error.POSITION_UNAVAILABLE
                    ? 'unavailable'
                    : 'unknown',
            message: error.message
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      )

      cleanups.push(() => navigator.geolocation.clearWatch(watchId))
      return
    }

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (mode === 'accelerometer') {
        const sample = {
          x: event.accelerationIncludingGravity?.x ?? event.acceleration?.x ?? 0,
          y: event.accelerationIncludingGravity?.y ?? event.acceleration?.y ?? 0,
          z: event.accelerationIncludingGravity?.z ?? event.acceleration?.z ?? 0
        }

        accelerometerSample.value = sample
        onSample(sample)
        return
      }

      const sample = {
        alpha: event.rotationRate?.alpha ?? 0,
        beta: event.rotationRate?.beta ?? 0,
        gamma: event.rotationRate?.gamma ?? 0
      }

      gyroscopeSample.value = sample
      onSample(sample)
    }

    window.addEventListener('devicemotion', handleDeviceMotion)
    cleanups.push(() => window.removeEventListener('devicemotion', handleDeviceMotion))

    if (mode === 'accelerometer' && 'DeviceOrientationEvent' in window) {
      const handleDeviceOrientationFallback = (event: DeviceOrientationEvent) => {
        if (typeof event.beta !== 'number' && typeof event.gamma !== 'number') {
          return
        }

        // Some iPhone/PWA contexts expose orientation angles more reliably than
        // devicemotion acceleration values. Normalize them into the same sample shape.
        const sample = {
          x: (event.gamma ?? 0) / 10,
          y: (event.beta ?? 0) / 10,
          z: 0
        }

        accelerometerSample.value = sample
        onSample(sample)
      }

      window.addEventListener('deviceorientation', handleDeviceOrientationFallback)
      cleanups.push(() => window.removeEventListener('deviceorientation', handleDeviceOrientationFallback))
    }
  }

  return {
    accelerometerSample,
    compassSample,
    gpsSample,
    gyroscopeSample,
    permissionState,
    requestPermission,
    rotationSample,
    startListening,
    stopListening,
    supported
  }
}
