<template>
  <AppShell
    eyebrow="Diagnostic pwa"
    title="Verifie un telephone avant de l’acheter"
    description="Une base mobile-first pour guider un diagnostic rapide, rassurer l’acheteur et structurer les controles sur place."
  >
    <div class="space-y-4">
      <AppCard class="overflow-hidden">
        <div class="rounded-[24px] bg-slate-950 p-5 text-white">
          <p class="text-xs uppercase tracking-[0.2em] text-orange-300">Parcours</p>
          <h2 class="mt-2 text-2xl font-semibold">Controle en 5 sections</h2>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            Identification, etat physique, ecran, media et connectivite.
          </p>
        </div>
        <div class="mt-4 space-y-3">
          <SectionListItem
            v-for="section in catalog"
            :key="section.id"
            :title="section.title"
            :description="section.description"
            :completed="false"
          />
        </div>
      </AppCard>

      <AppCard>
        <p class="text-sm leading-6 text-slate-600">
          Cette premiere version ne sauvegarde rien localement: elle sert a poser le flux de diagnostic et la base PWA.
        </p>
      </AppCard>
    </div>

    <template #actions>
      <RouterLink class="flex-1" :to="{ name: 'diagnostic-new' }">
        <AppButton class="w-full">Demarrer un diagnostic</AppButton>
      </RouterLink>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import SectionListItem from '../components/SectionListItem.vue'
import { diagnosticCatalog as catalog } from '../data/diagnosticCatalog'
</script>
