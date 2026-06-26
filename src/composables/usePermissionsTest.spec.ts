import { describe, expect, it, vi } from 'vitest'
import { usePermissionsTest } from './usePermissionsTest'

describe('usePermissionsTest', () => {
  it('returns pending when only geolocation state is queryable', async () => {
    const definition = usePermissionsTest()

    if (!definition.run) {
      throw new Error('permissions test unavailable')
    }

    Object.defineProperty(window.navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn(async ({ name }: { name: string }) => ({
          state: name === 'geolocation' ? 'granted' : 'prompt'
        }))
      }
    })

    const result = await definition.run()

    expect(result.testId).toBe('permissions')
    expect(result.status).toBe('pending')
    expect(result.details.map((detail) => detail.label)).toEqual(['Camera', 'Microphone', 'Geolocalisation'])
  })
})
