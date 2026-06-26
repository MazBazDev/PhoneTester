<template>
  <button
    type="button"
    :class="[
      'inline-flex min-h-12 cursor-pointer touch-manipulation items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition',
      variant === 'primary'
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600'
        : 'border border-slate-300 bg-white/80 text-slate-900 hover:bg-slate-50'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary'
  }>(),
  {
    variant: 'primary'
  }
)
</script>
