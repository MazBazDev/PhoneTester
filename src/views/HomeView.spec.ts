import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the diagnostic launch CTA', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/intro', name: 'diagnostic-intro', component: { template: '<div />' } },
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: { template: '<div />' }
        }
      ]
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia, router]
      }
    })

    expect(wrapper.text()).toContain('Demarrer un diagnostic')
    expect(wrapper.text()).toContain('14 tests deja jouables')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('diagnostic-intro')
  })
})
