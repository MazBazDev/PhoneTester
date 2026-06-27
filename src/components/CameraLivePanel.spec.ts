import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CameraLivePanel from './CameraLivePanel.vue'

describe('CameraLivePanel', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn(async () => undefined)
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(() => undefined)
    })
  })

  it('emits preview readiness when the video becomes capturable', async () => {
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get: () => 1280
    })
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get: () => 720
    })
    Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
      configurable: true,
      get: () => 3
    })

    const wrapper = mount(CameraLivePanel, {
      props: {
        stream: {} as MediaStream,
        previewUrl: null,
        activeDeviceLabel: 'Rear Wide',
        availableDevices: [],
        selectedDeviceId: 'rear-wide'
      }
    })

    const video = wrapper.get('video').element as HTMLVideoElement
    Object.defineProperty(video, 'videoWidth', {
      configurable: true,
      value: 1280
    })
    Object.defineProperty(video, 'videoHeight', {
      configurable: true,
      value: 720
    })
    Object.defineProperty(video, 'readyState', {
      configurable: true,
      value: 3
    })

    await wrapper.get('video').trigger('playing')

    expect(wrapper.emitted('preview-ready-change')?.some(([ready]) => ready === true)).toBe(true)
  })

  it('resets preview readiness when the stream changes', async () => {
    const wrapper = mount(CameraLivePanel, {
      props: {
        stream: {} as MediaStream,
        previewUrl: null,
        activeDeviceLabel: 'Rear Wide',
        availableDevices: [],
        selectedDeviceId: 'rear-wide'
      }
    })

    await wrapper.setProps({
      stream: {} as MediaStream
    })

    expect(wrapper.emitted('preview-ready-change')?.some(([ready]) => ready === false)).toBe(true)
  })
})
