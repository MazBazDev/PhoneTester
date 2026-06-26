<template>
  <div class="space-y-4">
    <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ title }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ hint }}</p>
        </div>
        <span
          class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
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
        class="rounded-[20px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4"
      >
        <div class="flex items-center justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ entry.label }}</p>
          <p class="text-lg font-bold text-slate-950">{{ formatValue(entry.value) }}</p>
        </div>
        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-300/80">
          <div
            class="h-full rounded-full bg-slate-950 transition-all duration-150"
            :style="{ width: `${computeWidth(entry.value)}%` }"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_0.85fr]">
      <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mesures</p>
        <div class="mt-3 divide-y divide-stone-300/80">
          <div
            v-for="entry in infoEntries"
            :key="entry.label"
            class="flex items-center justify-between gap-4 py-3"
          >
            <span class="text-sm text-slate-600">{{ entry.label }}</span>
            <span class="text-sm font-semibold text-slate-950">{{ entry.value }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
        <template v-if="variant === 'compass'">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Compas</p>
          <div class="mt-4 flex justify-center">
            <div class="relative flex h-48 w-48 items-center justify-center rounded-full border border-stone-300 bg-stone-100">
              <div class="absolute inset-4 rounded-full border border-dashed border-stone-300" />
              <div class="absolute top-4 text-xs font-semibold text-slate-950">N</div>
              <div class="absolute bottom-4 text-xs font-semibold text-slate-500">S</div>
              <div class="absolute left-4 text-xs font-semibold text-slate-500">O</div>
              <div class="absolute right-4 text-xs font-semibold text-slate-500">E</div>
              <div
                class="absolute h-20 w-1 origin-bottom rounded-full bg-slate-950 transition-transform duration-150"
                :style="compassNeedleTransform"
              />
              <div class="absolute h-4 w-4 rounded-full bg-slate-950" />
            </div>
          </div>
          <p class="mt-4 text-center text-sm font-medium text-slate-700">
            {{ compassLabel }}
          </p>
        </template>

        <template v-else-if="variant === 'gps'">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">GPS</p>
          <div class="mt-4 rounded-[20px] border border-stone-300 bg-stone-100 px-4 py-5">
            <p class="text-sm text-slate-600">{{ gpsStatusLabel }}</p>
            <p class="mt-2 text-3xl font-bold text-slate-950">{{ gpsMainValue }}</p>
            <p class="mt-2 text-sm text-slate-500">{{ gpsSecondaryLabel }}</p>
          </div>
        </template>

        <template v-else>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Orientation</p>
          <div class="mt-4 flex justify-center">
            <div class="perspective-[1000px]">
              <div
                class="h-44 w-24 rounded-[24px] border border-stone-300 bg-linear-to-b from-stone-200 to-stone-50 p-3 transition-transform duration-150"
                :style="phoneTransform"
              >
                <div class="h-full rounded-[18px] border border-stone-300 bg-white" />
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
