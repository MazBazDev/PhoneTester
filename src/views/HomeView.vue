<template>
  <AppShell
    eyebrow="Verification iPhone"
    title="Verifier un iPhone avant achat"
    description="Un parcours simple pour savoir rapidement si le telephone semble en bon etat."
  >
    <div class="space-y-4">
      <section class="rounded-[32px] border border-stone-300/80 bg-[color:var(--color-surface)] px-5 py-6">
        <div class="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
          Achat entre particuliers
        </div>
        <h2 class="mt-4 max-w-[14rem] font-[var(--font-display)] text-[2.2rem] font-bold leading-[0.95] tracking-[-0.05em] text-slate-950">
          Un avis simple avant de te decider
        </h2>
        <p class="mt-4 max-w-sm text-sm leading-6 text-slate-600">
          Ecran, mouvements, son, camera, localisation. En quelques minutes, tu sais si quelque chose cloche.
        </p>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <div class="rounded-[20px] bg-stone-100 px-3 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Duree</p>
            <p class="mt-1 text-sm font-semibold text-slate-950">2 a 3 min</p>
          </div>
          <div class="rounded-[20px] bg-stone-100 px-3 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Usage</p>
            <p class="mt-1 text-sm font-semibold text-slate-950">Tres simple</p>
          </div>
          <div class="rounded-[20px] bg-stone-100 px-3 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Resultat</p>
            <p class="mt-1 text-sm font-semibold text-slate-950">Verdict clair</p>
          </div>
        </div>
      </section>

      <AppCard>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-950" />
            <p class="text-sm leading-6 text-slate-700">Des verifications guidees, une par une.</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-950" />
            <p class="text-sm leading-6 text-slate-700">Un resultat simple pour voir vite si quelque chose cloche.</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-950" />
            <p class="text-sm leading-6 text-slate-700">Aucune competence technique necessaire.</p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="resumableSession" class="border border-stone-300/80 bg-[linear-gradient(180deg,rgba(250,248,244,0.96),rgba(241,237,230,0.96))]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Verification en cours</p>
            <p class="mt-1 text-sm leading-6 text-slate-700">
              Tu peux reprendre la session la ou tu t’es arrete.
            </p>
          </div>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
            {{ visibleProgress.completed }}/{{ visibleProgress.total }}
          </span>
        </div>
        <div class="mt-4">
          <ProgressBar :model="visibleProgress" />
        </div>
      </AppCard>
    </div>

    <template #actions>
      <AppButton v-if="resumableSession" class="flex-1" variant="secondary" @click="resumeSession">Reprendre</AppButton>
      <AppButton class="flex-1" @click="startDiagnostic">
        {{ resumableSession ? 'Nouvelle verification' : 'Commencer' }}
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
import ProgressBar from '../components/ProgressBar.vue'
import { getVisibleProgressModel } from '../lib/productPresentation'
import { useDiagnosticStore } from '../stores/diagnostic'

const router = useRouter()
const store = useDiagnosticStore()
store.ensureHydrated()

const resumableSession = computed(() => store.activeSession)
const resumableStep = computed(() => {
  const session = store.activeSession
  return session ? store.getFirstIncompleteStep(session.id) ?? session.steps[0] ?? null : null
})
const visibleProgress = computed(() =>
  getVisibleProgressModel(store.activeSession?.steps ?? [], resumableStep.value?.testId)
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

const startDiagnostic = async () => {
  const session = store.startSession()
  const firstStep = session.steps[0]

  if (!firstStep) {
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: session.id,
      testId: firstStep.testId
    }
  })
}
</script>
