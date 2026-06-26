<template>
  <article
    class="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4"
  >
    <div class="pr-4">
      <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
      <p class="mt-1 text-sm text-slate-600">{{ description }}</p>
    </div>
    <span
      class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
      :class="completed ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'"
    >
      {{ completed ? 'Pret' : 'A faire' }}
    </span>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  completed: boolean
}>()
</script>
