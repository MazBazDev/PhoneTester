<template>
  <AppShell
    v-if="session"
    eyebrow="Resultat"
    title="Verdict du telephone"
    description="Une lecture simple pour savoir si le telephone semble fonctionner correctement."
    :progress="visibleProgress"
  >
    <div class="space-y-4">
      <AppCard :class="verdictCardClass">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em]" :class="verdictEyebrowClass">Verdict final</p>
            <h2 class="mt-2 text-3xl font-bold text-slate-950">{{ verdict.title }}</h2>
            <p class="mt-2 max-w-sm text-sm leading-6 text-slate-700">{{ verdict.description }}</p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" :class="verdictPillClass">
            {{ verdictPillLabel }}
          </span>
        </div>
      </AppCard>

      <AppCard v-if="okItems.length > 0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Tout semble fonctionner</p>
        <div class="mt-3 space-y-2">
          <div
            v-for="item in okItems"
            :key="item.testId"
            class="rounded-[18px] bg-emerald-50 px-4 py-3"
          >
            <p class="text-sm font-semibold text-slate-950">{{ item.label }}</p>
            <p class="mt-1 text-sm text-slate-700">{{ item.message }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="verifyItems.length > 0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">A verifier</p>
        <div class="mt-3 space-y-2">
          <div
            v-for="item in verifyItems"
            :key="item.testId"
            class="rounded-[18px] bg-amber-50 px-4 py-3"
          >
            <p class="text-sm font-semibold text-slate-950">{{ item.label }}</p>
            <p class="mt-1 text-sm text-slate-700">{{ item.message }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="attentionItems.length > 0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Attention</p>
        <div class="mt-3 space-y-2">
          <div
            v-for="item in attentionItems"
            :key="item.testId"
            class="rounded-[18px] bg-rose-50 px-4 py-3"
          >
            <p class="text-sm font-semibold text-slate-950">{{ item.label }}</p>
            <p class="mt-1 text-sm text-slate-700">{{ item.message }}</p>
          </div>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton class="flex-1" variant="secondary" @click="reset">Nouvelle verification</AppButton>
      <AppButton class="flex-1" @click="resume">
        {{ firstIncomplete ? 'Reprendre' : 'Refaire' }}
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
import {
  getProductTestCopy,
  getSimpleStepMessage,
  getStatusBucket,
  getVerdictMeta,
  getVisibleProgressModel,
  getVisibleSummarySteps
} from '../lib/productPresentation'
import { useDiagnosticStore } from '../stores/diagnostic'

const props = defineProps<{
  sessionId: string
}>()

const router = useRouter()
const store = useDiagnosticStore()

const session = computed(() => store.getSessionById(props.sessionId))
const firstIncomplete = computed(() => store.getFirstIncompleteStep(props.sessionId))
const completedSteps = computed(() => (session.value?.steps ?? []).filter((step) => step.result !== null))
const visibleProgress = computed(() =>
  getVisibleProgressModel(session.value?.steps ?? [], null, { expandCurrent: false })
)
const verdict = computed(() => getVerdictMeta(completedSteps.value))
const summaryItems = computed(() =>
  getVisibleSummarySteps(completedSteps.value).map((entry) => {
    const representativeStep = entry.steps[entry.steps.length - 1]
    const fallbackLabel = store.getTestDefinition(representativeStep.testId)?.name ?? representativeStep.testId
    const label = getProductTestCopy(entry.testId, fallbackLabel).label

    return {
      testId: entry.testId,
      bucket: getStatusBucket(entry.status),
      label,
      message: getSimpleStepMessage(
        {
          ...representativeStep,
          testId: entry.testId,
          result: representativeStep.result
            ? {
                ...representativeStep.result,
                status: entry.status
              }
            : representativeStep.result
        },
        fallbackLabel
      )
    }
  })
)

const okItems = computed(() => summaryItems.value.filter((item) => item.bucket === 'ok'))
const verifyItems = computed(() => summaryItems.value.filter((item) => item.bucket === 'verify'))
const attentionItems = computed(() => summaryItems.value.filter((item) => item.bucket === 'attention'))

const verdictCardClass = computed(() => {
  if (verdict.value.tone === 'green') {
    return 'border border-emerald-200 bg-emerald-50/80'
  }

  if (verdict.value.tone === 'red') {
    return 'border border-rose-200 bg-rose-50/80'
  }

  return 'border border-amber-200 bg-amber-50/80'
})

const verdictEyebrowClass = computed(() => {
  if (verdict.value.tone === 'green') {
    return 'text-emerald-700'
  }

  if (verdict.value.tone === 'red') {
    return 'text-rose-700'
  }

  return 'text-amber-700'
})

const verdictPillClass = computed(() => {
  if (verdict.value.tone === 'green') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (verdict.value.tone === 'red') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-amber-100 text-amber-700'
})

const verdictPillLabel = computed(() => {
  if (verdict.value.tone === 'green') {
    return 'vert'
  }

  if (verdict.value.tone === 'red') {
    return 'rouge'
  }

  return 'orange'
})

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
