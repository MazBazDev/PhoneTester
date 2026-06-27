import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PhonePreviewPanel from './PhonePreviewPanel.vue'

describe('PhonePreviewPanel', () => {
  it('renders rotation mode with validated states', () => {
    const wrapper = mount(PhonePreviewPanel, {
      props: {
        mode: 'rotation',
        orientation: 'landscape',
        validatedStates: ['portrait', 'landscape'],
        activeState: 'landscape'
      }
    })

    expect(wrapper.find('[data-testid="phone-preview-rotation"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Portrait')
    expect(wrapper.text()).toContain('Paysage')
  })

  it('renders tilt mode with directional states', () => {
    const wrapper = mount(PhonePreviewPanel, {
      props: {
        mode: 'tilt',
        validatedStates: ['left', 'up'],
        activeState: 'left'
      }
    })

    expect(wrapper.find('[data-testid="phone-preview-tilt"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gauche')
    expect(wrapper.text()).toContain('Haut')
  })

  it('renders gyro mode with axis states', () => {
    const wrapper = mount(PhonePreviewPanel, {
      props: {
        mode: 'gyro',
        validatedStates: ['alpha'],
        activeState: 'beta'
      }
    })

    expect(wrapper.find('[data-testid="phone-preview-gyro"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Beta')
    expect(wrapper.text()).toContain('Gamma')
  })

  it('renders screen intro animation shell', () => {
    const wrapper = mount(PhonePreviewPanel, {
      props: {
        mode: 'screen-intro'
      }
    })

    expect(wrapper.find('[data-testid="phone-preview-screen-intro"]').exists()).toBe(true)
    expect(wrapper.find('.phone-preview-screen-cycle').exists()).toBe(true)
  })

  it('renders touch intro grid', () => {
    const wrapper = mount(PhonePreviewPanel, {
      props: {
        mode: 'touch-intro'
      }
    })

    expect(wrapper.find('[data-testid="phone-preview-touch-intro"]').exists()).toBe(true)
    expect(wrapper.findAll('.touch-preview-cell')).toHaveLength(20)
  })
})
