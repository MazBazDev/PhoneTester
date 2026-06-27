import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './HomeView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

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

    expect(wrapper.text()).toContain('Commencer')
    expect(wrapper.text()).toContain('Un avis simple avant de te decider')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('diagnostic-auto-test')
  })

  it('renders grouped progress for a resumable session', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')
    store.completeGuidedStep(session.id, 'screen')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: HomeView }]
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia, router]
      }
    })

    expect(wrapper.text()).toContain('Verification en cours')
    expect(wrapper.text()).toContain('Ecran')
    expect(wrapper.text()).toContain('Mouvements')
  })
})
