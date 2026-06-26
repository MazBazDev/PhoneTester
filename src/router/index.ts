import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DiagnosticIntroView from '../views/DiagnosticIntroView.vue'
import DiagnosticAutoTestView from '../views/DiagnosticAutoTestView.vue'
import DiagnosticSummaryView from '../views/DiagnosticSummaryView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/intro',
      name: 'diagnostic-intro',
      component: DiagnosticIntroView
    },
    {
      path: '/diagnostic/:sessionId/auto/:testId',
      name: 'diagnostic-auto-test',
      component: DiagnosticAutoTestView,
      props: true
    },
    {
      path: '/diagnostic/:sessionId/summary',
      name: 'diagnostic-summary',
      component: DiagnosticSummaryView,
      props: true
    }
  ]
})

router.beforeEach((to) => {
  const store = useDiagnosticStore()
  store.ensureHydrated()

  if (to.name === 'home' || to.name === 'diagnostic-intro') {
    return true
  }

  const sessionId = String(to.params.sessionId)
  const session = store.getSessionById(sessionId)

  if (!session) {
    return { name: 'home' }
  }

  if (to.name === 'diagnostic-summary') {
    return true
  }

  const testId = String(to.params.testId)
  const definition = store.getTestDefinition(testId)

  if (!definition) {
    const firstIncomplete = store.getFirstIncompleteStep(sessionId)

    return {
      name: 'diagnostic-auto-test',
      params: {
        sessionId,
        testId: firstIncomplete?.testId ?? session.steps[0]?.testId
      }
    }
  }

  return true
})
