<template>
  <AppShell
    eyebrow="iPhone diagnostic"
    title="Teste un iPhone avant achat en moins de 3 minutes"
    description="Ce premier lot pose le moteur modulaire de diagnostic, optimise pour Safari sur iPhone, avec reprise automatique de session."
  >
    <div class="space-y-4">
      <AppCard class="overflow-hidden">
        <div class="rounded-[24px] bg-slate-950 p-5 text-white">
          <p class="text-xs uppercase tracking-[0.2em] text-orange-300">Premier lot</p>
          <h2 class="mt-2 text-2xl font-semibold">2 auto-tests reels</h2>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            Informations appareil et permissions, avec resultat persiste localement.
          </p>
        </div>
        <div class="mt-4 space-y-3">
          <SectionListItem v-for="test in store.testDefinitions" :key="test.id" :title="test.name" :description="test.description" :completed="Boolean(activeSessionStepIds.has(test.id))" />
        </div>
      </AppCard>

      <AppCard>
        <p class="text-sm leading-6 text-slate-600">
          La session en cours est reprise automatiquement apres refresh grace au stockage local.
        </p>
      </AppCard>
    </div>

    <template #actions>
      <AppButton v-if="resumableSession" class="flex-1" variant="secondary" @click="resumeSession">Reprendre</AppButton>
      <RouterLink class="flex-1" :to="{ name: 'diagnostic-intro' }">
        <AppButton class="w-full">{{ resumableSession ? 'Nouvelle session' : 'Demarrer un diagnostic' }}</AppButton>
      </RouterLink>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
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
</script>
