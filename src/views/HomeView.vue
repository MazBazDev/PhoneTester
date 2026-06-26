<template>
  <AppShell
    eyebrow="Phone tester"
    title="Diagnostic iPhone avant achat"
    description="Rapide, local, lisible sur iPhone."
  >
    <div class="space-y-3">
      <AppCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Session</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-950">{{ store.testDefinitions.length }} tests prets</h2>
            <p class="mt-2 text-sm text-slate-600">
              Ecran, tactile, capteurs, GPS, micro et cameras.
            </p>
          </div>
          <span class="rounded-full bg-stone-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            Safari iPhone
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-stone-300/80 pt-4 text-sm text-slate-600">
          <span>{{ resumableSession ? 'Session detectee' : 'Aucune session en cours' }}</span>
          <span class="font-semibold text-slate-950">{{ activeSessionStepIds.size }}/{{ store.testDefinitions.length }}</span>
        </div>
      </AppCard>

      <AppCard>
        <div class="space-y-2">
          <SectionListItem
            v-for="test in store.testDefinitions"
            :key="test.id"
            :title="test.name"
            :completed="Boolean(activeSessionStepIds.has(test.id))"
            variant="compact"
          />
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton v-if="resumableSession" class="flex-1" variant="secondary" @click="resumeSession">Reprendre</AppButton>
      <AppButton class="flex-1" @click="startDiagnostic">
        {{ resumableSession ? 'Nouvelle session' : 'Demarrer' }}
      </AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import SectionListItem from '../components/SectionListItem.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const router = useRouter()
const store = useDiagnosticStore()
store.ensureHydrated()

const resumableSession = computed(() => store.activeSession)
const activeSessionStepIds = computed(
  () => new Set(store.activeSession?.steps.filter((step) => step.result !== null).map((step) => step.testId) ?? [])
)

const resumeSession = async () => {
  const session = store.resumeSession()
  const nextStep = session ? store.getFirstIncompleteStep(session.id) ?? session.steps[0] : null

  if (!session || !nextStep) {
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: session.id,
      testId: nextStep.testId
    }
  })
}

const startDiagnostic = async () => {
  const session = store.startSession()
  const firstStep = session.steps[0]

  if (!firstStep) {
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: session.id,
      testId: firstStep.testId
    }
  })
}
</script>
