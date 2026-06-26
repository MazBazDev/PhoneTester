<template>
  <div
    class="mx-auto flex min-h-screen w-full max-w-md flex-col"
    :class="immersive ? 'px-0 pb-0 pt-0' : 'px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4'"
  >
    <header v-if="!immersive" class="mb-4">
      <p v-if="eyebrow" class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{{ eyebrow }}</p>
      <h1 class="mt-2 font-[var(--font-display)] text-[2rem] font-bold tracking-[-0.03em] text-slate-950">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {{ description }}
      </p>
      <div v-if="progress !== undefined" class="mt-4">
        <ProgressBar :value="progress" />
      </div>
    </header>

    <main class="flex-1" :class="immersive ? 'flex flex-col' : ''">
      <slot />
    </main>

    <footer
      v-if="$slots.actions && !immersive"
      class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-stone-300 bg-[color:var(--color-page)] px-4 py-3 pb-[calc(0.9rem+env(safe-area-inset-bottom))]"
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
  eyebrow?: string
  title: string
  description?: string
  progress?: number
  immersive?: boolean
}>()
</script>
