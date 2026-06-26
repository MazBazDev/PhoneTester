<template>
  <AppShell
    eyebrow="Preparation"
    title="Prepare ton iPhone pour le diagnostic"
    description="Ce lot lance deux auto-tests, deux tests visuels, un tactile, un multitouch, quatre tests capteurs, le GPS, trois tests camera et un test micro."
  >
    <div class="space-y-4">
      <AppCard v-if="launchError" class="border border-rose-200 bg-rose-50/80">
        <p class="text-sm font-semibold text-rose-700">Impossible de lancer le diagnostic.</p>
        <p class="mt-2 text-sm leading-6 text-rose-700">{{ launchError }}</p>
      </AppCard>

      <AppCard>
        <ul class="space-y-3 text-sm leading-6 text-slate-700">
          <li>Utilise Safari sur iPhone pour un resultat representatif.</li>
          <li>Autorise la geolocalisation et garde le navigateur actif.</li>
          <li>Prevois aussi quelques mouvements, rotations, l'acces a la localisation, la camera et le microphone.</li>
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

      <AppCard class="md:hidden">
        <div class="grid grid-cols-1 gap-3">
          <AppButton class="w-full" variant="secondary" @click="goHome">Retour</AppButton>
          <AppButton class="w-full" @click="begin">Lancer le diagnostic</AppButton>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton class="hidden flex-1 md:inline-flex" variant="secondary" @click="goHome">Retour</AppButton>
      <AppButton class="hidden flex-1 md:inline-flex" @click="begin">Lancer le diagnostic</AppButton>
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
