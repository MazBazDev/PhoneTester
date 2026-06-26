<template>
  <AppShell
    eyebrow="Nouvelle session"
    title="Renseigne rapidement l’appareil"
    description="Ces informations amorcent la session avant les controles. Elles restent en memoire uniquement."
  >
    <AppCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Marque</span>
          <input
            v-model="form.brand"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            placeholder="Apple, Samsung..."
          />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Modele</span>
          <input
            v-model="form.model"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            placeholder="iPhone 14, Galaxy S23..."
          />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Stockage</span>
          <input
            v-model="form.storage"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            placeholder="128 Go"
          />
        </label>
      </form>
    </AppCard>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'home' }">
        <AppButton class="w-full" variant="secondary">Retour</AppButton>
      </RouterLink>
      <AppButton class="flex-1" @click="handleSubmit">Commencer</AppButton>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import { useDiagnosticStore } from '../stores/diagnostic'

const router = useRouter()
const store = useDiagnosticStore()

const form = reactive({
  brand: '',
  model: '',
  storage: ''
})

const handleSubmit = () => {
  const session = store.startSession(form)

  void router.push({
    name: 'diagnostic-section',
    params: {
      sessionId: session.id,
      sectionId: session.sections[0].id
    }
  })
}
</script>
