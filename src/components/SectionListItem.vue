<template>
  <article
    class="flex items-center justify-between gap-3 rounded-[18px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3"
  >
    <div class="min-w-0 pr-3">
      <h3 :class="variant === 'compact' ? 'text-sm font-semibold text-slate-950' : 'text-base font-semibold text-slate-950'">
        {{ title }}
      </h3>
      <p v-if="description" class="mt-1 text-sm text-slate-600">{{ description }}</p>
    </div>
    <span
      class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
      :class="completed ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-slate-600'"
    >
      {{ completed ? 'Pret' : 'A faire' }}
    </span>
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  completed: boolean
  variant?: 'default' | 'compact'
}>(), {
  description: undefined,
  variant: 'default'
})
</script>
