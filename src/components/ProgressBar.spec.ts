import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from './ProgressBar.vue'
import type { ProgressModel } from '../lib/productPresentation'

describe('ProgressBar', () => {
  it('renders one compact line with a single expanded block', () => {
    const model: ProgressModel = {
      completed: 1,
      total: 5,
      percent: 20,
      blocks: [
        {
          id: 'screen',
          label: 'Ecran',
          state: 'completed',
          expanded: false,
          completionRatio: 1,
          subSteps: [
            { id: 'screen', label: 'Ecran', state: 'completed', completed: true },
            { id: 'touch', label: 'Ecran', state: 'completed', completed: true },
            { id: 'multitouch', label: 'Ecran', state: 'completed', completed: true }
          ]
        },
        {
          id: 'movement',
          label: 'Mouvements',
          state: 'current',
          expanded: true,
          completionRatio: 0.5,
          subSteps: [
            { id: 'rotation', label: 'Mouvements', state: 'completed', completed: true },
            { id: 'accelerometer', label: 'Mouvements', state: 'current', completed: false },
            { id: 'gyroscope', label: 'Mouvements', state: 'upcoming', completed: false },
            { id: 'compass', label: 'Mouvements', state: 'upcoming', completed: false }
          ]
        },
        {
          id: 'sound',
          label: 'Son',
          state: 'upcoming',
          expanded: false,
          completionRatio: 0,
          subSteps: [{ id: 'microphone', label: 'Son', state: 'upcoming', completed: false }]
        },
        {
          id: 'camera',
          label: 'Camera',
          state: 'upcoming',
          expanded: false,
          completionRatio: 0,
          subSteps: [
            { id: 'camera-rear', label: 'Camera', state: 'upcoming', completed: false },
            { id: 'autofocus', label: 'Camera', state: 'upcoming', completed: false },
            { id: 'camera-front', label: 'Camera', state: 'upcoming', completed: false }
          ]
        },
        {
          id: 'location',
          label: 'Localisation',
          state: 'upcoming',
          expanded: false,
          completionRatio: 0,
          subSteps: [{ id: 'gps', label: 'Localisation', state: 'upcoming', completed: false }]
        }
      ]
    }

    const wrapper = mount(ProgressBar, {
      props: { model }
    })

    expect(wrapper.text()).toContain('Ecran')
    expect(wrapper.text()).toContain('Mouvements')
    expect(wrapper.text()).toContain('1/5')
    expect(wrapper.findAll('.h-2').length).toBe(4)
    expect(wrapper.findAll('[style*="flex: 1 1 auto"]').length).toBe(1)
    expect(wrapper.findAll('[style*="width: 2.75rem"]').length).toBe(4)
    expect(wrapper.findAll('.h-12').length).toBeGreaterThan(0)
  })
})
