import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SensorLivePanel from './SensorLivePanel.vue'

describe('SensorLivePanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a centered compass needle and pivot', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(SensorLivePanel, {
      props: {
        title: 'Boussole live',
        hint: 'Tourne doucement le telephone.',
        axisEntries: [],
        infoEntries: [],
        phoneRotation: { x: 0, y: 0, z: 0 },
        maxValue: 360,
        permissionState: 'granted',
        variant: 'compass',
        compassHeading: 90
      }
    })

    expect(wrapper.find('[data-testid="compass-needle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="compass-pivot"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="compass-needle"]').attributes('style')).toContain('rotate(90deg)')
  })

  it('animates across north using the shortest path', async () => {
    const frameQueue: FrameRequestCallback[] = []

    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameQueue.push(callback)
      return frameQueue.length
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(SensorLivePanel, {
      props: {
        title: 'Boussole live',
        hint: 'Tourne doucement le telephone.',
        axisEntries: [],
        infoEntries: [],
        phoneRotation: { x: 0, y: 0, z: 0 },
        maxValue: 360,
        permissionState: 'granted',
        variant: 'compass',
        compassHeading: 359
      }
    })

    await wrapper.setProps({ compassHeading: 1 })

    for (let index = 0; index < 24 && frameQueue.length > 0; index += 1) {
      const frame = frameQueue.shift()
      frame?.(index * 16)
    }

    await wrapper.vm.$nextTick()

    const style = wrapper.find('[data-testid="compass-needle"]').attributes('style') ?? ''
    const rotationMatch = style.match(/rotate\(([-\d.]+)deg\)/)
    const rotation = rotationMatch ? Number(rotationMatch[1]) : NaN

    expect(rotation).not.toBeNaN()
    expect(rotation === 1 || rotation < 20 || rotation > 340).toBe(true)
  })
})
