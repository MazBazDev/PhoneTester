<template>
  <div
    class="mx-auto flex min-h-screen w-full max-w-md flex-col"
    :class="immersive ? 'px-0 pb-0 pt-0' : 'px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6'"
  >
    <header v-if="!immersive" class="mb-6">
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

    <main class="flex-1" :class="immersive ? 'flex flex-col' : ''">
      <slot />
    </main>

    <footer
      v-if="$slots.actions && !immersive"
      class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-white/80 bg-white/85 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur"
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
  immersive?: boolean
}>()
</script>
