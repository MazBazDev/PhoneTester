<template>
  <div class="space-y-5">
    <div class="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ title }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ hint }}</p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          :class="permissionClass"
        >
          {{ permissionLabel }}
        </span>
      </div>
    </div>

    <div v-if="axisEntries.length > 0" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="entry in axisEntries"
        :key="entry.label"
        class="rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ entry.label }}</p>
          <p class="text-lg font-bold text-slate-950">{{ formatValue(entry.value) }}</p>
        </div>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-400 transition-all duration-150"
            :style="{ width: `${computeWidth(entry.value)}%` }"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_0.85fr]">
      <div class="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mesures clefs</p>
        <div class="mt-4 space-y-3">
          <div
            v-for="entry in infoEntries"
            :key="entry.label"
            class="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
          >
            <span class="text-sm text-slate-600">{{ entry.label }}</span>
            <span class="text-sm font-semibold text-slate-950">{{ entry.value }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <template v-if="variant === 'compass'">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Compas</p>
          <div class="mt-6 flex justify-center">
            <div class="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/15 bg-radial-[circle_at_center] from-slate-700 via-slate-900 to-slate-950">
              <div class="absolute inset-4 rounded-full border border-dashed border-white/10" />
              <div class="absolute top-4 text-xs font-semibold text-orange-300">N</div>
              <div class="absolute bottom-4 text-xs font-semibold text-slate-400">S</div>
              <div class="absolute left-4 text-xs font-semibold text-slate-400">O</div>
              <div class="absolute right-4 text-xs font-semibold text-slate-400">E</div>
              <div
                class="absolute h-20 w-1 origin-bottom rounded-full bg-linear-to-t from-orange-500 to-amber-300 shadow-[0_0_20px_rgba(251,146,60,0.35)] transition-transform duration-150"
                :style="compassNeedleTransform"
              />
              <div class="absolute h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
          <p class="mt-5 text-center text-sm font-medium text-slate-300">
            {{ compassLabel }}
          </p>
        </template>

        <template v-else-if="variant === 'gps'">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Acquisition GPS</p>
          <div class="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p class="text-sm text-slate-300">{{ gpsStatusLabel }}</p>
            <p class="mt-3 text-3xl font-bold text-white">{{ gpsMainValue }}</p>
            <p class="mt-3 text-sm text-slate-400">{{ gpsSecondaryLabel }}</p>
          </div>
        </template>

        <template v-else>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">Mini telephone 3D</p>
          <div class="mt-6 flex justify-center">
            <div class="perspective-[1000px]">
              <div
                class="h-44 w-24 rounded-[28px] border border-white/20 bg-linear-to-b from-slate-700 to-slate-900 p-3 shadow-2xl transition-transform duration-150"
                :style="phoneTransform"
              >
                <div class="h-full rounded-[20px] border border-white/15 bg-linear-to-b from-slate-500 to-slate-800" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MotionPermissionState } from '../composables/useMotionSensors'

interface AxisEntry {
  label: string
  value: number
}

interface InfoEntry {
  label: string
  value: string
}

const props = defineProps<{
  title: string
  hint: string
  axisEntries: AxisEntry[]
  infoEntries: InfoEntry[]
  phoneRotation: {
    x: number
    y: number
    z: number
  }
  maxValue: number
  permissionState: MotionPermissionState | string
  variant?: 'sensor' | 'compass' | 'gps'
  compassHeading?: number | null
  gpsStatusLabel?: string
  gpsMainValue?: string
  gpsSecondaryLabel?: string
}>()

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

const computeWidth = (value: number) => {
  const normalized = Math.min(1, Math.abs(value) / props.maxValue)
  return Math.max(4, normalized * 100)
}

const formatValue = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`

const phoneTransform = computed(
  () =>
    `rotateX(${props.phoneRotation.x}deg) rotateY(${props.phoneRotation.y}deg) rotateZ(${props.phoneRotation.z}deg)`
)

const compassNeedleTransform = computed(() => {
  const heading = typeof props.compassHeading === 'number' ? props.compassHeading : 0
  return `rotate(${heading}deg) translateY(-4px)`
})

const compassLabel = computed(() =>
  typeof props.compassHeading === 'number' ? `Cap nord estime: ${Math.round(props.compassHeading)}°` : 'Cap nord indisponible'
)
</script>
