<template>
  <div>
    <div class="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      <span>Progression</span>
      <span>{{ value }}%</span>
    </div>
    <div class="h-3 overflow-hidden rounded-full bg-slate-200">
      <div
        class="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-400 transition-all duration-300"
        :style="{ width: `${value}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>
