import { describe, expect, it, vi } from 'vitest'
import { useDeviceInfoTest } from './useDeviceInfoTest'

describe('useDeviceInfoTest', () => {
  it('returns warning outside iphone safari', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Chrome')
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel')
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR')
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0
    })
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    Object.defineProperty(window.screen, 'orientation', {
      configurable: true,
      value: { type: 'portrait-primary' } as ScreenOrientation
    })
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(844)
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3)

    const result = await useDeviceInfoTest().run()

    expect(result.testId).toBe('device-info')
    expect(result.status).toBe('warning')
    expect(result.details).toHaveLength(8)
  })
})
