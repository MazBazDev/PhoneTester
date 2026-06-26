<template>
  <AppShell
    eyebrow="Preparation"
    title="Prepare ton iPhone pour le diagnostic"
    description="Ce premier lot lance deux auto-tests reels: informations appareil et permissions essentielles."
  >
    <div class="space-y-4">
      <AppCard>
        <ul class="space-y-3 text-sm leading-6 text-slate-700">
          <li>Utilise Safari sur iPhone pour un resultat representatif.</li>
          <li>Autorise la geolocalisation et garde le navigateur actif.</li>
          <li>Les tests camera et microphone arriveront dans l’etape suivante.</li>
        </ul>
      </AppCard>

      <AppCard>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tests inclus</p>
        <div class="mt-4 space-y-3">
          <SectionListItem
            v-for="test in store.testDefinitions"
            :key="test.id"
            :title="test.name"
            :description="test.description"
            :completed="false"
          />
        </div>
      </AppCard>
    </div>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'home' }">
        <AppButton class="w-full" variant="secondary">Retour</AppButton>
      </RouterLink>
      <AppButton class="flex-1" @click="begin">Lancer le diagnostic</AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import SectionListItem from '../components/SectionListItem.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const router = useRouter()
const store = useDiagnosticStore()

const begin = async () => {
  const session = store.startSession()
  const firstStep = session.steps[0]

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: session.id,
      testId: firstStep.testId
    }
  })
}
</script>
