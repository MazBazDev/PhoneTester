<template>
  <AppShell
    v-if="session && testDefinition && step"
    eyebrow="Diagnostic automatique"
    :title="testDefinition.name"
    :description="testDefinition.description"
    :progress="store.sessionProgress"
  >
    <div class="space-y-4">
      <AppCard>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Test {{ currentIndex + 1 }} / {{ session.steps.length }}
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-700">
              {{ helperText }}
            </p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" :class="badgeClass">
            {{ badgeLabel }}
          </span>
        </div>
      </AppCard>

      <AppCard v-if="step.result">
        <p class="text-sm font-semibold text-slate-900">{{ step.result.summary }}</p>
        <div class="mt-4 space-y-3">
          <div
            v-for="detail in step.result.details"
            :key="detail.label"
            class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span class="text-sm text-slate-600">{{ detail.label }}</span>
            <span class="text-right text-sm font-semibold text-slate-900">{{ detail.value }}</span>
          </div>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'home' }">
        <AppButton class="w-full" variant="secondary">Quitter</AppButton>
      </RouterLink>
      <AppButton v-if="!step.result" class="flex-1" @click="runCurrentTest">Executer</AppButton>
      <AppButton v-else class="flex-1" @click="goNext">
        {{ nextStep ? 'Test suivant' : 'Voir le resume' }}
      </AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const props = defineProps<{
  sessionId: string
  testId: string
}>()

const router = useRouter()
const store = useDiagnosticStore()

const session = computed(() => store.getSessionById(props.sessionId))
const testDefinition = computed(() => store.getTestDefinition(props.testId))
const step = computed(() => store.getStepByTestId(props.sessionId, props.testId))
const nextStep = computed(() => store.getNextStep(props.sessionId, props.testId))
const currentIndex = computed(() => session.value?.steps.findIndex((entry) => entry.testId === props.testId) ?? 0)

const helperText = computed(() => {
  if (step.value?.status === 'running') {
    return 'Le navigateur collecte actuellement les informations disponibles.'
  }

  if (step.value?.result) {
    return 'Le test est termine. Verifie les details avant de passer au suivant.'
  }

  return 'Appuie sur le bouton pour lancer ce controle automatique.'
})

const badgeLabel = computed(() => {
  if (!step.value?.result) {
    return step.value?.status === 'running' ? 'en cours' : 'a lancer'
  }

  return step.value.result.status.replace('_', ' ')
})

const badgeClass = computed(() => {
  const status = step.value?.result?.status ?? (step.value?.status === 'running' ? 'pending' : 'skipped')

  if (status === 'pass') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'warning' || status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'failed') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-slate-200 text-slate-700'
})

const runCurrentTest = async () => {
  await store.runTest(props.sessionId, props.testId)
}

const goNext = async () => {
  if (!nextStep.value) {
    await router.push({
      name: 'diagnostic-summary',
      params: { sessionId: props.sessionId }
    })
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: props.sessionId,
      testId: nextStep.value.testId
    }
  })
}
</script>
