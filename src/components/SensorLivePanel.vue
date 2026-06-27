<template>
  <div class="space-y-4">
    <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ title }}</p>
      <p class="mt-1 text-sm text-slate-600">{{ hint }}</p>
    </div>

    <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <template v-if="variant === 'compass'">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Boussole</p>
        <div class="mt-4 flex justify-center">
          <div class="relative h-52 w-52 rounded-full border border-stone-300/80 bg-radial-[at_50%_35%] from-white via-stone-100 to-stone-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div class="absolute inset-3 rounded-full border border-stone-300/70" />
            <div class="absolute inset-6 rounded-full border border-dashed border-stone-300/80" />
            <div class="absolute inset-0">
              <div class="absolute left-1/2 top-3 -translate-x-1/2 text-xs font-semibold tracking-[0.24em] text-slate-950">N</div>
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-[0.24em] text-slate-500">S</div>
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-[0.24em] text-slate-500">O</div>
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-[0.24em] text-slate-500">E</div>
            </div>
            <div class="absolute inset-0">
              <div
                v-for="tick in compassTicks"
                :key="tick"
                class="absolute left-1/2 top-1/2 h-[5.2rem] w-[1px] origin-bottom -translate-x-1/2 -translate-y-full bg-stone-300/90"
                :style="{ transform: `translateX(-50%) translateY(-100%) rotate(${tick}deg)` }"
              />
            </div>
            <div class="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
              <div
                data-testid="compass-needle"
                class="relative h-full w-full origin-center will-change-transform"
                :style="compassNeedleTransform"
              >
                <div class="absolute left-1/2 top-1/2 h-[4.75rem] w-1 -translate-x-1/2 -translate-y-full rounded-full bg-slate-950 shadow-[0_0_16px_rgba(15,23,42,0.08)]" />
                <div class="absolute left-1/2 top-[calc(50%-5rem)] h-0 w-0 -translate-x-1/2 border-x-[8px] border-b-[16px] border-x-transparent border-b-rose-500 drop-shadow-[0_4px_10px_rgba(244,63,94,0.28)]" />
                <div class="absolute left-1/2 top-1/2 h-10 w-[2px] -translate-x-1/2 rounded-full bg-slate-300/90" />
              </div>
            </div>
            <div data-testid="compass-pivot" class="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-slate-950 shadow-[0_8px_18px_rgba(15,23,42,0.18)]" />
          </div>
        </div>
        <p class="mt-4 text-center text-sm font-medium text-slate-700">
          {{ compassLabel }}
        </p>
      </template>

      <template v-else-if="variant === 'gps'">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">GPS</p>
        <div class="mt-4 rounded-[20px] border border-stone-300 bg-stone-100 px-4 py-5">
          <p class="text-sm font-medium text-slate-700">{{ gpsStatusLabel }}</p>
          <p class="mt-2 text-sm text-slate-500">{{ gpsSecondaryLabel }}</p>
        </div>
      </template>

      <template v-else>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mouvement</p>
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
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { MotionPermissionState } from '../composables/useMotionSensors'
import { normalizeAngle, stepAngleTowards } from '../utils/angles'

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
  gpsSecondaryLabel?: string
}>()

const compassTicks = Array.from({ length: 12 }, (_, index) => index * 30)
const displayHeading = ref(0)
let compassAnimationFrameId: number | null = null

const stopCompassAnimation = () => {
  if (compassAnimationFrameId !== null) {
    cancelAnimationFrame(compassAnimationFrameId)
    compassAnimationFrameId = null
  }
}

const animateCompassHeading = (targetHeading: number) => {
  stopCompassAnimation()

  const tick = () => {
    displayHeading.value = stepAngleTowards(displayHeading.value, targetHeading)

    if (normalizeAngle(displayHeading.value) !== normalizeAngle(targetHeading)) {
      compassAnimationFrameId = requestAnimationFrame(tick)
      return
    }

    displayHeading.value = normalizeAngle(targetHeading)
    compassAnimationFrameId = null
  }

  tick()
}

const phoneTransform = computed(
  () =>
    `rotateX(${props.phoneRotation.x}deg) rotateY(${props.phoneRotation.y}deg) rotateZ(${props.phoneRotation.z}deg)`
)

const compassNeedleTransform = computed(() => {
  const heading = normalizeAngle(displayHeading.value)
  return {
    transform: `rotate(${heading}deg)`
  }
})

const compassLabel = computed(() =>
  typeof props.compassHeading === 'number' ? 'La direction reagit bien.' : 'Direction indisponible pour le moment.'
)

watch(
  () => props.compassHeading,
  (heading) => {
    if (typeof heading !== 'number') {
      stopCompassAnimation()
      return
    }

    if (compassAnimationFrameId === null && displayHeading.value === 0) {
      displayHeading.value = normalizeAngle(heading)
      return
    }

    animateCompassHeading(heading)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  stopCompassAnimation()
})
</script>
