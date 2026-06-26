<template>
  <AppShell
    v-if="section && session"
    eyebrow="Controle"
    :title="section.title"
    :description="section.description"
    :progress="progress"
  >
    <div class="space-y-4">
      <AppCard
        v-for="check in section.checks"
        :key="check.id"
      >
        <p class="text-base font-semibold text-slate-900">{{ check.label }}</p>
        <p class="mt-2 text-sm leading-6 text-slate-600">{{ check.helper }}</p>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <button
            v-for="option in answerOptions"
            :key="option.value"
            class="rounded-2xl border px-3 py-3 text-sm font-semibold transition"
            :class="
              answers[check.id] === option.value
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-slate-200 bg-white text-slate-700'
            "
            @click="setAnswer(check.id, option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'home' }">
        <AppButton class="w-full" variant="secondary">Quitter</AppButton>
      </RouterLink>
      <AppButton class="flex-1" @click="goNext">
        {{ isLastSection ? 'Voir le resume' : 'Section suivante' }}
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
  sectionId: string
}>()

const answerOptions = [
  { label: 'OK', value: 'ok' },
  { label: 'Moyen', value: 'warning' },
  { label: 'KO', value: 'fail' }
]

const router = useRouter()
const store = useDiagnosticStore()

const session = computed(() => store.getSessionById(props.sessionId))
const section = computed(() => session.value?.sections.find((entry) => entry.id === props.sectionId) ?? null)
const progress = computed(() => store.getProgress(props.sessionId))
const isLastSection = computed(() => {
  if (!session.value || !section.value) {
    return false
  }

  return session.value.sections.at(-1)?.id === section.value.id
})

const answers = computed<Record<string, string>>(() => {
  if (!section.value) {
    return {}
  }

  return Object.fromEntries(section.value.answers.map((answer) => [answer.checkId, answer.value]))
})

const setAnswer = (checkId: string, value: string) => {
  store.answerCheck(props.sessionId, props.sectionId, checkId, value)
}

const goNext = async () => {
  if (isLastSection.value) {
    await router.push({
      name: 'diagnostic-summary',
      params: { sessionId: props.sessionId }
    })
    return
  }

  const nextSection = store.goToNextSection(props.sessionId, props.sectionId)

  if (!nextSection) {
    return
  }

  await router.push({
    name: 'diagnostic-section',
    params: {
      sessionId: props.sessionId,
      sectionId: nextSection.id
    }
  })
}
</script>
