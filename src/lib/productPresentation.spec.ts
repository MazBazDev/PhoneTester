import { describe, expect, it } from 'vitest'
import {
  getProductTestCopy,
  getVerdictMeta,
  getVisibleProgress,
  getVisibleProgressModel,
  getVisibleSubStepMeta,
  getVisibleSummarySteps,
  getVisibleTestId
} from './productPresentation'

describe('productPresentation', () => {
  it('maps technical test ids to simple product labels', () => {
    expect(getProductTestCopy('camera-rear', 'Camera arriere').label).toBe('Camera')
    expect(getProductTestCopy('microphone', 'Microphone').label).toBe('Son')
  })

  it('groups internal tests into five visible product steps', () => {
    expect(getVisibleTestId('touch')).toBe('screen')
    expect(getVisibleTestId('multitouch')).toBe('screen')
    expect(getVisibleTestId('rotation')).toBe('movement')
    expect(getVisibleTestId('accelerometer')).toBe('movement')
    expect(getVisibleTestId('gyroscope')).toBe('movement')
    expect(getVisibleTestId('compass')).toBe('movement')
    expect(getVisibleTestId('microphone')).toBe('sound')
    expect(getVisibleTestId('camera-rear')).toBe('camera')
    expect(getVisibleTestId('camera-front')).toBe('camera')
    expect(getVisibleTestId('autofocus')).toBe('camera')
    expect(getVisibleTestId('gps')).toBe('location')

    expect(getVisibleSubStepMeta('gyroscope')).toEqual({
      groupId: 'movement',
      current: 3,
      total: 4,
      label: 'Mouvements',
      description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
    })

    const steps = [
      { testId: 'device-info', result: { status: 'pass' } },
      { testId: 'screen', result: { status: 'pass' } },
      { testId: 'touch', result: { status: 'pass' } },
      { testId: 'multitouch', result: { status: 'pass' } },
      { testId: 'rotation', result: { status: 'pass' } },
      { testId: 'accelerometer', result: { status: 'pass' } },
      { testId: 'gyroscope', result: { status: 'pass' } },
      { testId: 'compass', result: { status: 'pass' } },
      { testId: 'microphone', result: { status: 'pass' } },
      { testId: 'camera-rear', result: { status: 'pass' } },
      { testId: 'autofocus', result: { status: 'pass' } },
      { testId: 'camera-front', result: { status: 'warning' } },
      { testId: 'gps', result: { status: 'pass' } }
    ] as never

    expect(getVisibleProgress(steps).total).toBe(5)
    expect(getVisibleProgress(steps).completed).toBe(5)
    expect(getVisibleSummarySteps(steps).map((entry) => entry.testId)).toEqual([
      'screen',
      'movement',
      'sound',
      'camera',
      'location'
    ])
    expect(getVisibleSummarySteps(steps)[3]?.testId).toBe('camera')
    expect(getVisibleSummarySteps(steps)[3]?.status).toBe('warning')
  })

  it('builds an expanded block progress model for the current visible step', () => {
    const steps = [
      { testId: 'device-info', result: { status: 'pass' } },
      { testId: 'screen', result: { status: 'pass' } },
      { testId: 'touch', result: null },
      { testId: 'multitouch', result: null },
      { testId: 'rotation', result: null },
      { testId: 'accelerometer', result: null },
      { testId: 'gyroscope', result: null },
      { testId: 'compass', result: null },
      { testId: 'microphone', result: null },
      { testId: 'camera-rear', result: null },
      { testId: 'autofocus', result: null },
      { testId: 'camera-front', result: null },
      { testId: 'gps', result: null }
    ] as never

    const model = getVisibleProgressModel(steps, 'touch')

    expect(model.completed).toBe(0)
    expect(model.total).toBe(5)
    expect(model.blocks.map((block) => block.label)).toEqual([
      'Ecran',
      'Mouvements',
      'Son',
      'Camera',
      'Localisation'
    ])
    expect(model.blocks[0]).toMatchObject({
      id: 'screen',
      state: 'current',
      expanded: true
    })
    expect(model.blocks[0]?.subSteps.map((step) => step.state)).toEqual([
      'completed',
      'current',
      'upcoming'
    ])
    expect(model.blocks[1]?.expanded).toBe(false)
  })

  it('builds a collapsed fully completed progress model for the final summary', () => {
    const steps = [
      { testId: 'screen', result: { status: 'pass' } },
      { testId: 'touch', result: { status: 'pass' } },
      { testId: 'multitouch', result: { status: 'pass' } },
      { testId: 'rotation', result: { status: 'pass' } },
      { testId: 'accelerometer', result: { status: 'pass' } },
      { testId: 'gyroscope', result: { status: 'pass' } },
      { testId: 'compass', result: { status: 'pass' } },
      { testId: 'microphone', result: { status: 'pass' } },
      { testId: 'camera-rear', result: { status: 'pass' } },
      { testId: 'autofocus', result: { status: 'pass' } },
      { testId: 'camera-front', result: { status: 'pass' } },
      { testId: 'gps', result: { status: 'pass' } }
    ] as never

    const model = getVisibleProgressModel(steps, null, { expandCurrent: false })

    expect(model.blocks.every((block) => block.state === 'completed')).toBe(true)
    expect(model.blocks.every((block) => block.expanded === false)).toBe(true)
  })

  it('builds a green, orange or red verdict from step statuses', () => {
    expect(
      getVerdictMeta([
        { testId: 'screen', status: 'completed', result: { status: 'pass' } } as never
      ]).tone
    ).toBe('green')

    expect(
      getVerdictMeta([
        { testId: 'screen', status: 'completed', result: { status: 'warning' } } as never
      ]).tone
    ).toBe('orange')

    expect(
      getVerdictMeta([
        { testId: 'screen', status: 'completed', result: { status: 'failed' } } as never
      ]).tone
    ).toBe('red')
  })
})
