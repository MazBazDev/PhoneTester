import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NewDiagnosticView from '../views/NewDiagnosticView.vue'
import DiagnosticSectionView from '../views/DiagnosticSectionView.vue'
import DiagnosticSummaryView from '../views/DiagnosticSummaryView.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/diagnostic/new',
      name: 'diagnostic-new',
      component: NewDiagnosticView
    },
    {
      path: '/diagnostic/:sessionId/section/:sectionId',
      name: 'diagnostic-section',
      component: DiagnosticSectionView,
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
  if (!to.params.sessionId) {
    return true
  }

  const store = useDiagnosticStore()
  const sessionId = String(to.params.sessionId)
  const session = store.getSessionById(sessionId)

  if (!session) {
    return { name: 'home' }
  }

  if (to.name === 'diagnostic-summary') {
    return true
  }

  const targetSectionId = String(to.params.sectionId)
  const targetSection = session.sections.find((section) => section.id === targetSectionId)

  if (!targetSection) {
    return {
      name: 'diagnostic-section',
      params: {
        sessionId,
        sectionId: session.sections[0]?.id
      }
    }
  }

  return true
})
