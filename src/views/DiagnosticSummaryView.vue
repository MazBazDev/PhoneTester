<template>
  <AppShell
    v-if="session"
    eyebrow="Resume"
    title="Synthese du diagnostic"
    description="Vue d’ensemble des controles saisis pendant cette session."
    :progress="progress"
  >
    <div class="space-y-4">
      <AppCard>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Appareil</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">
              {{ displayName }}
            </h2>
            <p class="mt-2 text-sm text-slate-600">Stockage: {{ session.phoneProfile.storage || 'non renseigne' }}</p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            :class="session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'"
          >
            {{ session.status === 'completed' ? 'complet' : 'brouillon' }}
          </span>
        </div>
      </AppCard>

      <AppCard v-for="section in session.sections" :key="section.id">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-slate-900">{{ section.title }}</h3>
            <p class="mt-1 text-sm text-slate-600">{{ section.description }}</p>
          </div>
          <span class="text-sm font-semibold text-slate-500">
            {{ section.answers.length }}/{{ section.checks.length }}
          </span>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'home' }">
        <AppButton class="w-full" variant="secondary">Accueil</AppButton>
      </RouterLink>
      <RouterLink
        class="flex-1"
        :to="{
          name: 'diagnostic-section',
          params: { sessionId, sectionId: session.sections[0].id }
        }"
      >
        <AppButton class="w-full">Reprendre</AppButton>
      </RouterLink>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const props = defineProps<{
  sessionId: string
}>()

const store = useDiagnosticStore()

const session = computed(() => store.getSessionById(props.sessionId))
const progress = computed(() => store.getProgress(props.sessionId))
const displayName = computed(() => {
  if (!session.value) {
    return 'Appareil non renseigne'
  }

  const { brand, model } = session.value.phoneProfile
  return [brand, model].filter(Boolean).join(' ') || 'Appareil non renseigne'
})
</script>
