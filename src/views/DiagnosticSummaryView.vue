<template>
  <AppShell
    v-if="session"
    eyebrow="Resume"
    title="Diagnostic termine"
    description="Lecture rapide des points valides et des doutes."
    :progress="store.sessionProgress"
  >
    <div class="space-y-3">
      <AppCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Score</p>
            <h2 class="mt-2 text-4xl font-bold text-slate-950">{{ store.currentScore }}%</h2>
            <p class="mt-2 text-sm text-slate-600">{{ session.steps.length }} tests analyses</p>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            :class="session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
          >
            {{ session.status === 'completed' ? 'termine' : 'partiel' }}
          </span>
        </div>
      </AppCard>

      <AppCard v-for="step in session.steps" :key="step.testId">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold text-slate-950">{{ store.getTestDefinition(step.testId)?.name }}</h3>
            <p class="mt-1 truncate text-sm text-slate-600">{{ step.result?.summary || 'Pas encore execute.' }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" :class="statusClass(step.result?.status)">
            {{ step.result?.status?.replace('_', ' ') || 'pending' }}
          </span>
        </div>

        <details
          v-if="step.result?.details?.length || getPreview(step.testId)"
          class="mt-3 rounded-[18px] border border-stone-300/80 bg-[color:var(--color-surface)]"
          :open="shouldOpen(step.result?.status)"
        >
          <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700">
            Details
          </summary>
          <div class="space-y-2 border-t border-stone-300/80 px-4 py-3">
            <img
              v-if="getPreview(step.testId)"
              :src="getPreview(step.testId) ?? undefined"
              :alt="`Capture ${store.getTestDefinition(step.testId)?.name || step.testId}`"
              class="rounded-2xl border border-stone-300/80 object-cover"
            />
            <div
              v-for="detail in step.result?.details ?? []"
              :key="`${step.testId}-${detail.label}`"
              class="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-3 py-2"
            >
              <span class="text-xs font-medium text-slate-500">{{ detail.label }}</span>
              <span class="text-xs font-semibold text-slate-900">{{ detail.value }}</span>
            </div>
          </div>
        </details>
      </AppCard>
    </div>

    <template #actions>
      <AppButton class="flex-1" variant="secondary" @click="reset">Nouvelle session</AppButton>
      <AppButton class="flex-1" @click="resume">
        {{ firstIncomplete ? 'Reprendre' : 'Relancer' }}
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
import type { TestStatus } from '../domain/diagnostic'
import { getSessionCapture } from '../lib/sessionMedia'
import { useDiagnosticStore } from '../stores/diagnostic'

const props = defineProps<{
  sessionId: string
}>()

const router = useRouter()
const store = useDiagnosticStore()

const session = computed(() => store.getSessionById(props.sessionId))
const firstIncomplete = computed(() => store.getFirstIncompleteStep(props.sessionId))
const getPreview = (testId: string) => getSessionCapture(props.sessionId, testId)

const statusClass = (status?: TestStatus) => {
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
}

const shouldOpen = (status?: TestStatus) => status === 'warning' || status === 'failed'

const reset = async () => {
  store.resetSession()
  await router.push({ name: 'home' })
}

const resume = async () => {
  const targetStep = firstIncomplete.value ?? session.value?.steps[0]

  if (!session.value || !targetStep) {
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: props.sessionId,
      testId: targetStep.testId
    }
  })
}
</script>
