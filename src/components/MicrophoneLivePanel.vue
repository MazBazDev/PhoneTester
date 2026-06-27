<template>
  <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
    <div class="flex items-center justify-between gap-4">
      <p class="text-sm text-slate-600">{{ hint }}</p>
      <p class="shrink-0 text-sm font-semibold text-slate-950">{{ soundDetected ? 'Detecte' : 'En ecoute' }}</p>
    </div>
    <div class="mt-4 overflow-hidden rounded-[20px] border border-stone-300/80 bg-stone-100/80 px-3 py-4">
      <svg
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        class="h-28 w-full"
        role="img"
        aria-label="Waveform microphone"
      >
        <path d="M0 16 H100" class="stroke-stone-300" stroke-width="1" fill="none" />
        <polyline
          data-testid="microphone-waveform"
          :points="waveformPoints"
          class="fill-none stroke-slate-950"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <div class="mt-4 h-2 overflow-hidden rounded-full bg-stone-300/80">
      <div class="h-full rounded-full bg-slate-950 transition-all duration-100" :style="{ width: `${Math.max(4, levelPercent)}%` }" />
    </div>
    <p class="mt-4 text-sm font-medium" :class="soundDetected ? 'text-emerald-700' : 'text-slate-600'">
      {{ soundDetected ? 'Un son a bien ete detecte.' : 'Parle ou souffle pour faire monter le niveau.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hint: string
  level: number
  peakLevel: number
  soundDetected: boolean
  permissionState: string
  waveform: number[]
}>()

const levelPercent = computed(() => Math.round(props.level * 100))
const waveformPoints = computed(() => {
  const samples = props.waveform.length > 0 ? props.waveform : [0.5, 0.5]

  return samples
    .map((sample, index) => {
      const x = samples.length === 1 ? 50 : (index / (samples.length - 1)) * 100
      const clampedSample = Math.min(1, Math.max(0, sample))
      const y = 28 - clampedSample * 24
      return `${x},${y}`
    })
    .join(' ')
})
</script>
