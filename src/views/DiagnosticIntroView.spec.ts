import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DiagnosticIntroView from './DiagnosticIntroView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

describe('DiagnosticIntroView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts a session and navigates to the first diagnostic test', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div />' } },
        { path: '/intro', name: 'diagnostic-intro', component: DiagnosticIntroView },
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: { template: '<div />' }
        }
      ]
    })

    await router.push('/intro')
    await router.isReady()

    const wrapper = mount(DiagnosticIntroView, {
      global: {
        plugins: [pinia, router]
      }
    })

    const launchButton = wrapper
      .findAll('button')
      .find((entry) => entry.text().includes('Lancer'))

    if (!launchButton) {
      throw new Error('launch button not found')
    }

    await launchButton.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('diagnostic-auto-test')
    expect(useDiagnosticStore().activeSession?.steps[0]?.testId).toBe('device-info')
  })
})
