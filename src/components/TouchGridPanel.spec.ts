import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TouchGridPanel from './TouchGridPanel.vue'

describe('TouchGridPanel', () => {
  it('renders the full 7x12 grid', () => {
    const wrapper = mount(TouchGridPanel, {
      props: {
        rows: 12,
        cols: 7,
        visitedCellIds: [],
        immersive: true
      }
    })

    expect(wrapper.findAll('[data-testid="touch-stage"] > div')).toHaveLength(84)
  })

  it('emits visited cells from a pointer interaction', async () => {
    const wrapper = mount(TouchGridPanel, {
      props: {
        rows: 12,
        cols: 7,
        visitedCellIds: [],
        immersive: true
      }
    })

    const stage = wrapper.get('[data-testid="touch-stage"]')

    Object.defineProperty(stage.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 70,
        bottom: 120,
        width: 70,
        height: 120
      })
    })

    await stage.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 10,
      clientY: 10
    })

    expect(wrapper.emitted('track')?.[0]?.[0]).toEqual({
      cellIds: ['1-1']
    })
  })

  it('keeps emitting visited cells while the active pointer moves', async () => {
    const wrapper = mount(TouchGridPanel, {
      props: {
        rows: 12,
        cols: 7,
        visitedCellIds: [],
        immersive: true
      }
    })

    const stage = wrapper.get('[data-testid="touch-stage"]')

    Object.defineProperty(stage.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 70,
        bottom: 120,
        width: 70,
        height: 120
      })
    })

    Object.defineProperty(stage.element, 'setPointerCapture', {
      configurable: true,
      value: () => undefined
    })

    await stage.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 10,
      clientY: 10
    })

    await stage.trigger('pointermove', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 30,
      clientY: 30
    })

    const emitted = wrapper.emitted('track')
    const payload = emitted?.[1]?.[0] as { cellIds: string[] } | undefined

    expect(payload?.cellIds.length).toBeGreaterThan(0)
  })
})
