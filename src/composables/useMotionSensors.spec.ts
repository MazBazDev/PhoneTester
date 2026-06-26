import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMotionSensors } from './useMotionSensors'

describe('useMotionSensors', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads compass heading from deviceorientationabsolute events', () => {
    Object.defineProperty(window, 'DeviceOrientationEvent', {
      configurable: true,
      value: class DeviceOrientationEvent {}
    })
    Object.defineProperty(window, 'ondeviceorientationabsolute', {
      configurable: true,
      value: null
    })

    const sensors = useMotionSensors()
    const onSample = vi.fn()

    sensors.startListening('compass', onSample)

    const event = new Event('deviceorientationabsolute') as Event & {
      alpha?: number
      beta?: number
      gamma?: number
    }
    event.alpha = 90
    event.beta = 0
    event.gamma = 0

    window.dispatchEvent(event)

    expect(onSample).toHaveBeenCalled()
    expect(onSample.mock.lastCall?.[0]).toMatchObject({
      heading: 270,
      hasHeading: true
    })
  })
})
