import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DiagnosticSummaryView from './DiagnosticSummaryView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

describe('DiagnosticSummaryView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders a simple traffic-light style summary', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDiagnosticStore()
    const session = store.startSession()

    store.startGuidedTest(session.id, 'screen')
    store.updateGuidedMetrics(session.id, 'screen', {})
    store.moveGuidedTestToConfirm(session.id, 'screen')
    store.setGuidedUserVerdict(session.id, 'screen', 'pass')
    store.finalizeGuidedTest(session.id, 'screen')

    store.startGuidedTest(session.id, 'camera')
    store.updateGuidedMetrics(session.id, 'camera', {
      supported: true,
      permissionState: 'granted',
      streamOpened: true,
      rearAvailableDeviceIds: ['rear-1'],
      rearCapturedDeviceIds: [],
      nearValidated: false,
      farValidated: false,
      frontCaptureSucceeded: false
    })
    store.moveGuidedTestToConfirm(session.id, 'camera')
    store.setGuidedUserVerdict(session.id, 'camera', 'warning')
    store.finalizeGuidedTest(session.id, 'camera')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/diagnostic/:sessionId/summary',
          name: 'diagnostic-summary',
          component: DiagnosticSummaryView,
          props: true
        },
        { path: '/', name: 'home', component: { template: '<div />' } },
        {
          path: '/diagnostic/:sessionId/auto/:testId',
          name: 'diagnostic-auto-test',
          component: { template: '<div />' }
        }
      ]
    })

    await router.push(`/diagnostic/${session.id}/summary`)
    await router.isReady()

    const wrapper = mount(DiagnosticSummaryView, {
      props: {
        sessionId: session.id
      },
      global: {
        plugins: [pinia, router]
      }
    })

    expect(wrapper.text()).toContain('Quelques points sont a verifier')
    expect(wrapper.text()).toContain('Tout semble fonctionner')
    expect(wrapper.text()).toContain('A verifier')
    expect(wrapper.text()).toContain('Ecran')
    expect(wrapper.text()).toContain('Camera')
    expect(wrapper.text()).toContain('Mouvements')
    expect(wrapper.text()).toContain('Localisation')
    expect(wrapper.text()).not.toContain('Selfie')
    expect(wrapper.text()).not.toContain('Score')
  })
})
