import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import DiagnosticAutoTestView from './DiagnosticAutoTestView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

describe('DiagnosticAutoTestView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('crypto', {
      randomUUID: () => 'session-1'
    })
  })

  it('auto-starts tests that require a system permission on entry', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: DiagnosticAutoTestView,
          props: true
        },
        {
          path: '/diagnostic/:sessionId/summary',
          name: 'diagnostic-summary',
          component: { template: '<div />' }
        },
        { path: '/', name: 'home', component: { template: '<div />' } }
      ]
    })

    await router.push(`/diagnostic/${session.id}/auto/gps`)
    await router.isReady()

    mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'gps'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'gps')?.guidedState?.phase).toBe('active')
  })

  it('renders the center screen probe and exits fullscreen on double tap', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()
    store.startGuidedTest(session.id, 'screen')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: DiagnosticAutoTestView,
          props: true
        },
        {
          path: '/diagnostic/:sessionId/summary',
          name: 'diagnostic-summary',
          component: { template: '<div />' }
        },
        { path: '/', name: 'home', component: { template: '<div />' } }
      ]
    })

    const exitFullscreen = vi.fn(async () => undefined)
    const requestFullscreen = vi.fn(async () => undefined)
    let fullscreenElement: Element | null = document.createElement('div')

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen
    })

    await router.push(`/diagnostic/${session.id}/auto/screen`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'screen'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    const probe = wrapper.get('section > div.flex.flex-1')

    await probe.trigger('dblclick')
    fullscreenElement = null

    expect(exitFullscreen).toHaveBeenCalled()
  })

  it('renders touch test as a pure fullscreen grid without helper text', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()
    store.startGuidedTest(session.id, 'touch')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: DiagnosticAutoTestView,
          props: true
        },
        {
          path: '/diagnostic/:sessionId/summary',
          name: 'diagnostic-summary',
          component: { template: '<div />' }
        },
        { path: '/', name: 'home', component: { template: '<div />' } }
      ]
    })

    await router.push(`/diagnostic/${session.id}/auto/touch`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'touch'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    expect(wrapper.find('[data-testid="touch-stage"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('5 taps rapides')
    expect(wrapper.text()).not.toContain('Couverture')
    expect(wrapper.text()).not.toContain('Restant')
    expect(wrapper.text()).not.toContain('x2 sortie')
  })

  it('renders multitouch live panel', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()
    store.startGuidedTest(session.id, 'multitouch')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: DiagnosticAutoTestView,
          props: true
        },
        {
          path: '/diagnostic/:sessionId/summary',
          name: 'diagnostic-summary',
          component: { template: '<div />' }
        },
        { path: '/', name: 'home', component: { template: '<div />' } }
      ]
    })

    await router.push(`/diagnostic/${session.id}/auto/multitouch`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'multitouch'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    expect(wrapper.text()).toContain('Multitouch live')
    expect(wrapper.text()).toContain('Maximum')
  })
})
