<template>
  <button
    type="button"
    :class="[
      'inline-flex min-h-12 cursor-pointer touch-manipulation items-center justify-center rounded-[18px] px-4 py-3 text-sm font-semibold transition-colors duration-150',
      variant === 'primary'
        ? 'bg-slate-950 text-white hover:bg-slate-800'
        : variant === 'secondary'
          ? 'border border-slate-300 bg-[color:var(--color-surface)] text-slate-900 hover:bg-white'
          : 'bg-transparent text-slate-600 hover:text-slate-950'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
  }>(),
  {
    variant: 'primary'
  }
)
</script>
