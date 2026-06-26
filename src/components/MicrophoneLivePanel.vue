<template>
  <div class="space-y-4">
    <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Microphone</p>
          <p class="mt-1 text-sm text-slate-600">{{ hint }}</p>
        </div>
        <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" :class="permissionClass">
          {{ permissionLabel }}
        </span>
      </div>
    </div>

    <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <div class="flex items-center justify-between gap-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Niveau instantane</p>
        <p class="text-sm font-semibold text-slate-950">{{ levelPercent }}%</p>
      </div>
      <div class="mt-3 h-3 overflow-hidden rounded-full bg-stone-300/80">
        <div class="h-full rounded-full bg-slate-950 transition-all duration-100" :style="{ width: `${Math.max(4, levelPercent)}%` }" />
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 border-t border-stone-300/80 pt-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Niveau</p>
          <p class="mt-1 text-xl font-bold text-slate-950">{{ levelPercent }}%</p>
        </div>
        <div class="text-right">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Pic</p>
          <p class="mt-1 text-xl font-bold text-slate-950">{{ peakPercent }}%</p>
        </div>
      </div>
      <p class="mt-4 text-sm font-medium" :class="soundDetected ? 'text-emerald-700' : 'text-slate-600'">
        {{ soundDetected ? 'Un son a bien ete detecte.' : 'Parle ou souffle pour faire monter le niveau.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MicrophonePermissionState } from '../composables/useMicrophoneLevel'

const props = defineProps<{
  hint: string
  level: number
  peakLevel: number
  soundDetected: boolean
  permissionState: MicrophonePermissionState | string
}>()

const levelPercent = computed(() => Math.round(props.level * 100))
const peakPercent = computed(() => Math.round(props.peakLevel * 100))

const permissionLabel = computed(() => {
  if (props.permissionState === 'granted') {
    return 'autorise'
  }

  if (props.permissionState === 'denied') {
    return 'refuse'
  }

  if (props.permissionState === 'not_supported') {
    return 'indispo'
  }

  return 'en attente'
})

const permissionClass = computed(() => {
  if (props.permissionState === 'granted') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (props.permissionState === 'denied') {
    return 'bg-rose-100 text-rose-700'
  }

  if (props.permissionState === 'not_supported') {
    return 'bg-slate-200 text-slate-700'
  }

  return 'bg-amber-100 text-amber-700'
})
</script>
