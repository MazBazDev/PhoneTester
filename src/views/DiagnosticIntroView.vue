<template>
  <AppShell
    eyebrow="Avant de commencer"
    title="Preparer le telephone"
    description="Trois verifications, puis lancement."
  >
    <div class="space-y-3">
      <AppCard v-if="launchError" class="border border-rose-200 bg-rose-50/80">
        <p class="text-sm font-semibold text-rose-700">Impossible de lancer le diagnostic.</p>
        <p class="mt-2 text-sm leading-6 text-rose-700">{{ launchError }}</p>
      </AppCard>

      <AppCard>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            Safari sur iPhone
          </span>
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            Permissions actives
          </span>
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            2 a 3 min
          </span>
        </div>
      </AppCard>

      <AppCard>
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Parcours</p>
          <span class="text-sm font-semibold text-slate-950">{{ store.testDefinitions.length }} tests</span>
        </div>
        <div class="space-y-2">
          <SectionListItem
            v-for="test in store.testDefinitions"
            :key="test.id"
            :title="test.name"
            :completed="false"
            variant="compact"
          />
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton class="flex-1" variant="secondary" @click="goHome">Retour</AppButton>
      <AppButton class="flex-1" @click="begin">Lancer</AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import SectionListItem from '../components/SectionListItem.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const router = useRouter()
const store = useDiagnosticStore()
const launchError = ref('')

const goHome = async () => {
  await router.push({ name: 'home' })
}

const begin = async () => {
  launchError.value = ''

  try {
    const session = store.startSession()
    const firstStep = session.steps[0]

    if (!firstStep) {
      throw new Error('Aucun test n est disponible dans la session.')
    }

    await router.push({
      name: 'diagnostic-auto-test',
      params: {
        sessionId: session.id,
        testId: firstStep.testId
      }
    })
  } catch (error) {
    launchError.value =
      error instanceof Error
        ? error.message
        : 'Une erreur navigateur a bloque le demarrage. Recharge la page puis reessaie.'
  }
}
</script>
