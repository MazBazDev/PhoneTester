import { describe, expect, it } from 'vitest'
import { getShortestAngleDelta, normalizeAngle, stepAngleTowards } from './angles'

describe('angles', () => {
  it('normalizes angles into the 0..359 range', () => {
    expect(normalizeAngle(0)).toBe(0)
    expect(normalizeAngle(360)).toBe(0)
    expect(normalizeAngle(-90)).toBe(270)
    expect(normalizeAngle(725)).toBe(5)
  })

  it('uses the shortest angular delta around north', () => {
    expect(getShortestAngleDelta(359, 1)).toBe(2)
    expect(getShortestAngleDelta(1, 359)).toBe(-2)
    expect(getShortestAngleDelta(90, 180)).toBe(90)
  })

  it('steps towards the target without taking a full turn', () => {
    const firstStep = stepAngleTowards(359, 1, 0.5, 0.01)
    const reverseStep = stepAngleTowards(1, 359, 0.5, 0.01)

    expect(firstStep).toBe(0)
    expect(reverseStep).toBe(0)
  })
})
