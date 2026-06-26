<template>
  <div class="space-y-4">
    <div class="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Micro live</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ hint }}</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" :class="permissionClass">
          {{ permissionLabel }}
        </span>
      </div>
    </div>

    <div class="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Niveau instantane</p>
      <div class="mt-5 h-5 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-300 transition-all duration-100" :style="{ width: `${Math.max(4, levelPercent)}%` }" />
      </div>
      <div class="mt-6 grid grid-cols-2 gap-3">
        <div class="rounded-2xl bg-white/10 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Niveau</p>
          <p class="mt-1 text-xl font-bold">{{ levelPercent }}%</p>
        </div>
        <div class="rounded-2xl bg-white/10 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Pic</p>
          <p class="mt-1 text-xl font-bold">{{ peakPercent }}%</p>
        </div>
      </div>
      <p class="mt-4 text-sm font-medium" :class="soundDetected ? 'text-emerald-300' : 'text-slate-300'">
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
