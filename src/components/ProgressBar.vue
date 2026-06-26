<template>
  <div>
    <div class="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span>Avancement</span>
      <span>{{ value }}%</span>
    </div>
    <div class="h-2 overflow-hidden rounded-full bg-stone-300/80">
      <div
        class="h-full rounded-full bg-slate-950 transition-all duration-200"
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
