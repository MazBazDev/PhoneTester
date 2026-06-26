<template>
  <div class="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">{{ eyebrow }}</p>
      <h1 class="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-tight text-slate-950">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-3 max-w-sm text-sm leading-6 text-slate-600">
        {{ description }}
      </p>
      <div v-if="progress !== undefined" class="mt-5">
        <ProgressBar :value="progress" />
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer
      v-if="$slots.actions"
      class="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-white/80 bg-white/85 px-4 py-4 backdrop-blur"
    >
      <div class="flex gap-3">
        <slot name="actions" />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ProgressBar from './ProgressBar.vue'

defineProps<{
  eyebrow: string
  title: string
  description?: string
  progress?: number
}>()
</script>
