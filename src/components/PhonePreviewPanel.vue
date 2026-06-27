<template>
  <section
    class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5"
    :data-testid="`phone-preview-${mode}`"
  >
    <div class="rounded-[22px] border border-stone-300/80 bg-stone-100/80 p-4">
      <div class="flex justify-center">
        <div class="perspective-[1200px]">
          <div
            class="relative mx-auto transition-transform duration-500 ease-out"
            :class="phoneShellClassName"
            :style="phoneTransformStyle"
          >
            <div class="absolute inset-[3%] rounded-[26px] bg-linear-to-b from-slate-900 via-slate-950 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
            <div class="absolute left-1/2 top-[4.5%] z-10 h-2 w-14 -translate-x-1/2 rounded-full bg-slate-800">
              <div class="mx-auto mt-[3px] h-[2px] w-7 rounded-full bg-slate-600" />
            </div>
            <div
              class="absolute inset-[7%] overflow-hidden rounded-[22px] border border-white/8 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
              :class="screenClassName"
            >
              <template v-if="mode === 'screen-intro'">
                <div class="phone-preview-screen-cycle absolute inset-0" />
                <div class="absolute inset-x-4 bottom-4 flex justify-center gap-2">
                  <span
                    v-for="stepIndex in 6"
                    :key="`screen-step-${stepIndex}`"
                    class="h-1.5 w-1.5 rounded-full bg-white/65"
                  />
                </div>
              </template>

              <template v-else-if="mode === 'touch-intro'">
                <div class="absolute inset-3 grid grid-cols-4 gap-1.5 rounded-[16px] bg-white/70 p-1.5">
                  <div
                    v-for="cell in touchIntroCells"
                    :key="cell.id"
                    class="touch-preview-cell rounded-[5px] border border-stone-200/80"
                    :style="{ animationDelay: `${cell.delay}s` }"
                  />
                </div>
                <div class="touch-preview-trace absolute left-[16%] top-[18%] h-4 w-4 rounded-full bg-slate-950/80 shadow-[0_0_0_8px_rgba(15,23,42,0.08)]" />
              </template>

              <template v-else>
                <div class="absolute inset-x-[18%] top-[18%] h-[8%] rounded-full bg-stone-200" />
                <div class="absolute inset-x-[22%] top-[32%] h-[10%] rounded-[999px] bg-stone-200/80" />
                <div class="absolute inset-x-[22%] top-[46%] h-[10%] rounded-[999px] bg-stone-200/70" />
                <div class="absolute inset-x-[18%] bottom-[14%] h-[7%] rounded-full bg-stone-200/80" />
              </template>
            </div>
            <div class="absolute -bottom-4 left-1/2 h-4 w-[66%] -translate-x-1/2 rounded-full bg-slate-950/10 blur-md" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="displayStates.length > 0" class="mt-4 grid gap-3" :class="gridClassName">
      <div
        v-for="state in displayStates"
        :key="state.key"
        class="flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm font-medium transition-colors"
        :class="
          state.active
            ? 'border-slate-950 bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]'
            : state.validated
              ? 'border-slate-950/15 bg-white text-slate-950'
              : 'border-stone-300 bg-stone-100 text-slate-500'
        "
      >
        <span>{{ state.label }}</span>
        <span
          class="flex h-6 w-6 items-center justify-center rounded-full border transition-colors"
          :class="
            state.active
              ? 'border-white/30 bg-white/12 text-white'
              : state.validated
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-stone-300 bg-white text-transparent'
          "
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-3.5 w-3.5">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 5.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

type PhonePreviewMode = 'rotation' | 'tilt' | 'gyro' | 'screen-intro' | 'touch-intro'
type RotationState = 'portrait' | 'landscape'
type TiltState = 'up' | 'down' | 'left' | 'right'
type GyroState = 'alpha' | 'beta' | 'gamma'
type PreviewState = RotationState | TiltState | GyroState

const props = withDefaults(defineProps<{
  mode: PhonePreviewMode
  orientation?: RotationState
  validatedStates?: PreviewState[]
  activeState?: PreviewState | null
  autoplay?: boolean
  compact?: boolean
}>(), {
  orientation: 'portrait',
  validatedStates: () => [],
  activeState: null,
  autoplay: true,
  compact: false
})

const labelMap: Record<PreviewState, string> = {
  portrait: 'Portrait',
  landscape: 'Paysage',
  up: 'Haut',
  down: 'Bas',
  left: 'Gauche',
  right: 'Droite',
  alpha: 'Alpha',
  beta: 'Beta',
  gamma: 'Gamma'
}

const stateKeysByMode: Record<PhonePreviewMode, PreviewState[]> = {
  rotation: ['portrait', 'landscape'],
  tilt: ['up', 'down', 'left', 'right'],
  gyro: ['alpha', 'beta', 'gamma'],
  'screen-intro': [],
  'touch-intro': []
}

const displayStates = computed(() =>
  stateKeysByMode[props.mode].map((key) => ({
    key,
    label: labelMap[key],
    active: props.activeState === key,
    validated: props.validatedStates.includes(key)
  }))
)

const gridClassName = computed(() => {
  if (props.mode === 'gyro') {
    return 'grid-cols-3'
  }

  if (props.mode === 'tilt') {
    return 'grid-cols-2'
  }

  return 'grid-cols-2'
})

const phoneShellClassName = computed(() => {
  if (props.mode === 'rotation' && props.orientation === 'landscape') {
    return 'h-44 w-28 sm:h-48 sm:w-[7.5rem]'
  }

  if (props.compact) {
    return 'h-40 w-24'
  }

  return 'h-48 w-[7.5rem]'
})

const phoneTransformStyle = computed<CSSProperties>(() => {
  if (props.mode === 'rotation') {
    return {
      transform: props.orientation === 'landscape' ? 'rotate(90deg) scale(0.96)' : 'rotate(0deg) scale(1)'
    }
  }

  if (props.mode === 'tilt') {
    const transforms: Record<string, string> = {
      left: 'rotate(-11deg) translateX(-12px)',
      right: 'rotate(11deg) translateX(12px)',
      up: 'translateY(-12px) rotate(-4deg)',
      down: 'translateY(12px) rotate(4deg)'
    }

    return {
      transform: transforms[props.activeState ?? ''] ?? 'translateY(0) rotate(0deg)'
    }
  }

  if (props.mode === 'gyro') {
    const transforms: Record<string, string> = {
      alpha: 'rotate(18deg)',
      beta: 'rotateX(38deg) rotateZ(-10deg)',
      gamma: 'rotateY(38deg) rotateZ(10deg)'
    }

    return {
      transformStyle: 'preserve-3d' as const,
      transform: transforms[props.activeState ?? ''] ?? 'rotate(0deg)'
    }
  }

  if (props.autoplay) {
    return {
      transform: 'translateY(0)',
      animation: 'phone-preview-float 3.6s ease-in-out infinite'
    }
  }

  return {
    transform: 'translateY(0)'
  }
})

const screenClassName = computed(() => {
  if (props.mode === 'screen-intro') {
    return 'bg-white'
  }

  if (props.mode === 'touch-intro') {
    return 'bg-linear-to-b from-stone-50 to-stone-100'
  }

  return 'bg-linear-to-b from-white to-stone-50'
})

const touchIntroCells = Array.from({ length: 20 }, (_, index) => ({
  id: `touch-cell-${index}`,
  delay: Number((index * 0.12).toFixed(2))
}))
</script>

<style scoped>
@keyframes phone-preview-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

@keyframes phone-preview-screen-cycle {
  0% {
    background: #ffffff;
  }

  16% {
    background: #020617;
  }

  33% {
    background: #dc2626;
  }

  50% {
    background: #16a34a;
  }

  66% {
    background: #2563eb;
  }

  83%,
  100% {
    background: #94a3b8;
  }
}

@keyframes touch-preview-cell {
  0%,
  100% {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(226, 232, 240, 0.85);
  }

  35%,
  60% {
    background: rgba(15, 23, 42, 0.14);
    border-color: rgba(15, 23, 42, 0.18);
  }
}

@keyframes touch-preview-trace {
  0% {
    transform: translate3d(0, 0, 0) scale(0.9);
  }

  20% {
    transform: translate3d(55px, 32px, 0) scale(1);
  }

  40% {
    transform: translate3d(16px, 74px, 0) scale(1);
  }

  62% {
    transform: translate3d(64px, 108px, 0) scale(1);
  }

  82% {
    transform: translate3d(26px, 148px, 0) scale(1);
  }

  100% {
    transform: translate3d(78px, 180px, 0) scale(0.9);
  }
}

.phone-preview-screen-cycle {
  animation: phone-preview-screen-cycle 6s steps(1, end) infinite;
}

.touch-preview-cell {
  animation: touch-preview-cell 2.8s ease-in-out infinite;
}

.touch-preview-trace {
  animation: touch-preview-trace 3.4s ease-in-out infinite;
}
</style>
