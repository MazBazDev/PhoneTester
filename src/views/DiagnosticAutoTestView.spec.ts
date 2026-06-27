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

  it('does not auto-start the rotation test on entry', async () => {
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

    await router.push(`/diagnostic/${session.id}/auto/rotation`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'rotation'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await nextTick()

    expect(store.getStepByTestId(session.id, 'rotation')?.guidedState?.phase).toBe('idle')
    expect(wrapper.text()).toContain('Commencer')
    expect(wrapper.text()).not.toContain('Autoriser')
  })

  it('does not auto-start the accelerometer test on entry', async () => {
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

    await router.push(`/diagnostic/${session.id}/auto/accelerometer`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'accelerometer'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await nextTick()

    expect(store.getStepByTestId(session.id, 'accelerometer')?.guidedState?.phase).toBe('idle')
    expect(wrapper.text()).toContain('Autoriser')
  })

  it('does not auto-start the gyroscope test on entry', async () => {
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

    await router.push(`/diagnostic/${session.id}/auto/gyroscope`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'gyroscope'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await nextTick()

    expect(store.getStepByTestId(session.id, 'gyroscope')?.guidedState?.phase).toBe('idle')
    expect(wrapper.text()).toContain('Autoriser')
  })

  it('does not auto-start the microphone test on entry', async () => {
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

    await router.push(`/diagnostic/${session.id}/auto/microphone`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'microphone'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await nextTick()

    expect(store.getStepByTestId(session.id, 'microphone')?.guidedState?.phase).toBe('idle')
    expect(wrapper.text()).toContain('Autoriser')
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

  it('uses a collect-then-confirm flow for the screen test', async () => {
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

    expect(wrapper.text()).toContain('Marquer un doute')
    expect(wrapper.text()).toContain('Couleur suivante')
    expect(wrapper.text()).not.toContain('Aucun defaut')
    expect(wrapper.text()).not.toContain('Defaut visible')

    for (let index = 0; index < 5; index += 1) {
      await wrapper.findAll('button').find((button) => button.text() === 'Couleur suivante')?.trigger('click')
      await nextTick()
    }

    await wrapper.findAll('button').find((button) => button.text() === 'Terminer la sequence')?.trigger('click')
    await nextTick()

    expect(store.getStepByTestId(session.id, 'screen')?.guidedState?.phase).toBe('confirm')
    expect(wrapper.text()).toContain('Verdict visuel final')
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

    expect(wrapper.text()).toContain('Multitouch')
    expect(wrapper.text()).toContain('0 actif')
    expect(wrapper.text()).toContain('Maximum')
  })

  it('moves rotation to confirm after portrait and landscape are observed', async () => {
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

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844
    })

    await router.push(`/diagnostic/${session.id}/auto/rotation`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'rotation'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Commencer')?.trigger('click')
    await nextTick()

    expect(store.getStepByTestId(session.id, 'rotation')?.guidedState?.phase).toBe('active')
    expect(wrapper.text()).toContain('Portrait')

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 844
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 390
    })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'rotation')?.guidedState?.phase).toBe('confirm')
    expect(wrapper.text()).toContain('Verdict rotation final')
  })

  it('moves accelerometer to confirm after four tilt directions are observed', async () => {
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

    let deviceMotionHandler: ((event: Event) => void) | undefined
    const originalAddEventListener = window.addEventListener.bind(window)
    const originalRemoveEventListener = window.removeEventListener.bind(window)

    Object.defineProperty(window, 'DeviceMotionEvent', {
      configurable: true,
      value: class DeviceMotionEvent {}
    })
    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      value: ((type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
        if (type === 'devicemotion' && typeof listener === 'function') {
          deviceMotionHandler = listener as (event: Event) => void
        }

        return originalAddEventListener(type, listener, options)
      }) as typeof window.addEventListener
    })
    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      value: ((type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean) =>
        originalRemoveEventListener(type, listener, options)) as typeof window.removeEventListener
    })

    await router.push(`/diagnostic/${session.id}/auto/accelerometer`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'accelerometer'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Autoriser')?.trigger('click')
    await nextTick()

    expect(store.getStepByTestId(session.id, 'accelerometer')?.guidedState?.phase).toBe('active')
    expect(deviceMotionHandler).toBeDefined()

    deviceMotionHandler?.({ accelerationIncludingGravity: { x: -3, y: 0, z: 9 } } as unknown as Event)
    deviceMotionHandler?.({ accelerationIncludingGravity: { x: 3, y: 0, z: 9 } } as unknown as Event)
    deviceMotionHandler?.({ accelerationIncludingGravity: { x: 0, y: -3, z: 9 } } as unknown as Event)
    deviceMotionHandler?.({ accelerationIncludingGravity: { x: 0, y: 3, z: 9 } } as unknown as Event)
    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'accelerometer')?.guidedState?.phase).toBe('confirm')
    expect(wrapper.text()).toContain('Verdict accelerometre final')
  })

  it('moves gyroscope to confirm after three axes are observed', async () => {
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

    let deviceMotionHandler: ((event: Event) => void) | undefined
    const originalAddEventListener = window.addEventListener.bind(window)
    const originalRemoveEventListener = window.removeEventListener.bind(window)

    Object.defineProperty(window, 'DeviceMotionEvent', {
      configurable: true,
      value: class DeviceMotionEvent {}
    })
    Object.defineProperty(window, 'addEventListener', {
      configurable: true,
      value: ((type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
        if (type === 'devicemotion' && typeof listener === 'function') {
          deviceMotionHandler = listener as (event: Event) => void
        }

        return originalAddEventListener(type, listener, options)
      }) as typeof window.addEventListener
    })
    Object.defineProperty(window, 'removeEventListener', {
      configurable: true,
      value: ((type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean) =>
        originalRemoveEventListener(type, listener, options)) as typeof window.removeEventListener
    })

    await router.push(`/diagnostic/${session.id}/auto/gyroscope`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'gyroscope'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Autoriser')?.trigger('click')
    await nextTick()

    expect(store.getStepByTestId(session.id, 'gyroscope')?.guidedState?.phase).toBe('active')
    expect(deviceMotionHandler).toBeDefined()

    deviceMotionHandler?.({ rotationRate: { alpha: 20, beta: 0, gamma: 0 } } as unknown as Event)
    deviceMotionHandler?.({ rotationRate: { alpha: 0, beta: 20, gamma: 0 } } as unknown as Event)
    deviceMotionHandler?.({ rotationRate: { alpha: 0, beta: 0, gamma: 20 } } as unknown as Event)
    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'gyroscope')?.guidedState?.phase).toBe('confirm')
    expect(wrapper.text()).toContain('Verdict gyroscope final')
  })

  it('keeps the microphone test active after sound detection and exposes the waveform', async () => {
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

    const stream = {
      getTracks: () => [{ stop: vi.fn() }]
    } as unknown as MediaStream
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => array.fill(160)),
      disconnect: vi.fn()
    } as unknown as AnalyserNode
    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as MediaStreamAudioSourceNode

    class FakeAudioContext {
      state: AudioContextState = 'running'
      createAnalyser() {
        return analyser
      }
      createMediaStreamSource() {
        return sourceNode
      }
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
    }

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream)
      }
    })
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext
    })

    await router.push(`/diagnostic/${session.id}/auto/microphone`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'microphone'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Autoriser')?.trigger('click')
    await nextTick()
    await nextTick()
    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'microphone')?.guidedState?.phase).toBe('active')
    expect(wrapper.text()).toContain('Fais monter le signal audio')
    expect(wrapper.text()).toContain('Relancer le micro')
    expect(wrapper.text()).toContain('detecte')
    expect(wrapper.find('[data-testid="microphone-waveform"]').exists()).toBe(true)
  })

  it('moves the microphone test to confirm only when the user clicks the manual action', async () => {
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

    const stream = {
      getTracks: () => [{ stop: vi.fn() }]
    } as unknown as MediaStream
    const analyser = {
      fftSize: 0,
      getByteTimeDomainData: vi.fn((array: Uint8Array) => array.fill(160)),
      disconnect: vi.fn()
    } as unknown as AnalyserNode
    const sourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as MediaStreamAudioSourceNode

    class FakeAudioContext {
      state: AudioContextState = 'running'
      createAnalyser() {
        return analyser
      }
      createMediaStreamSource() {
        return sourceNode
      }
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
    }

    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn(async () => stream)
      }
    })
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext
    })

    await router.push(`/diagnostic/${session.id}/auto/microphone`)
    await router.isReady()

    const wrapper = mount(DiagnosticAutoTestView, {
      props: {
        sessionId: session.id,
        testId: 'microphone'
      },
      global: {
        plugins: [pinia, router]
      }
    })

    await wrapper.findAll('button').find((button) => button.text() === 'Autoriser')?.trigger('click')
    await nextTick()
    await nextTick()
    await nextTick()
    await nextTick()

    expect(store.getStepByTestId(session.id, 'microphone')?.guidedState?.phase).toBe('active')

    await wrapper.findAll('button').find((button) => button.text() === 'Passer a la validation')?.trigger('click')
    await nextTick()

    expect(store.getStepByTestId(session.id, 'microphone')?.guidedState?.phase).toBe('confirm')
    expect(wrapper.text()).toContain('Verdict microphone final')
  })

})
