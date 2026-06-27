<template>
  <AppShell
    eyebrow="Avant de commencer"
    title="On va verifier l’essentiel"
    description="Le parcours est simple: suis les consignes, puis lis le resultat final."
  >
    <div class="space-y-4">
      <AppCard v-if="launchError" class="border border-rose-200 bg-rose-50/80">
        <p class="text-sm font-semibold text-rose-700">Impossible de lancer le diagnostic.</p>
        <p class="mt-2 text-sm leading-6 text-rose-700">{{ launchError }}</p>
      </AppCard>

      <AppCard>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            2 a 3 min
          </span>
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            Une etape a la fois
          </span>
          <span class="rounded-full border border-stone-300 bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold text-slate-700">
            Sans jargon
          </span>
        </div>
      </AppCard>

      <AppCard>
        <div class="space-y-3">
          <div class="rounded-[18px] bg-[color:var(--color-surface)] px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">1. Regarder</p>
            <p class="mt-1 text-sm text-slate-700">On verifie l’ecran, le tactile et l’affichage.</p>
          </div>
          <div class="rounded-[18px] bg-[color:var(--color-surface)] px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">2. Bouger</p>
            <p class="mt-1 text-sm text-slate-700">On verifie les reactions du telephone quand on le tourne ou le deplace.</p>
          </div>
          <div class="rounded-[18px] bg-[color:var(--color-surface)] px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">3. Ecouter et filmer</p>
            <p class="mt-1 text-sm text-slate-700">On verifie le son, les cameras et les photos.</p>
          </div>
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton class="flex-1" variant="secondary" @click="goHome">Retour</AppButton>
      <AppButton class="flex-1" @click="begin">Commencer</AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
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
