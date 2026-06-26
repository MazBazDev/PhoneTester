import { describe, expect, it, vi } from 'vitest'
import { usePermissionsTest } from './usePermissionsTest'

describe('usePermissionsTest', () => {
  it('returns pending when only geolocation state is queryable', async () => {
    Object.defineProperty(window.navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn(async ({ name }: { name: string }) => ({
          state: name === 'geolocation' ? 'granted' : 'prompt'
        }))
      }
    })

    const result = await usePermissionsTest().run()

    expect(result.testId).toBe('permissions')
    expect(result.status).toBe('pending')
    expect(result.details.map((detail) => detail.label)).toEqual(['Camera', 'Microphone', 'Geolocalisation'])
  })
})
