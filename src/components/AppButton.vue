<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex min-h-12 touch-manipulation items-center justify-center rounded-[18px] px-4 py-3 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
      disabled
        ? variant === 'ghost'
          ? 'bg-transparent text-slate-400'
          : 'border border-slate-200 bg-stone-100 text-slate-400'
        : variant === 'primary'
          ? 'cursor-pointer bg-slate-950 text-white hover:bg-slate-800'
          : variant === 'secondary'
            ? 'cursor-pointer border border-slate-300 bg-[color:var(--color-surface)] text-slate-900 hover:bg-white'
            : 'cursor-pointer bg-transparent text-slate-600 hover:text-slate-950'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    disabled: false
  }
)
</script>
