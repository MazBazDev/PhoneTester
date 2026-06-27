<template>
  <section class="overflow-hidden rounded-[32px] border border-emerald-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(236,253,245,0.94)_45%,_rgba(220,252,231,0.92))] px-5 py-8 shadow-[0_24px_80px_rgba(16,185,129,0.12)]">
    <div class="flex flex-col items-center text-center">
      <div
        :key="animationSeed"
        class="completion-badge relative flex h-28 w-28 items-center justify-center rounded-full border border-emerald-300/80 bg-white/90 shadow-[0_20px_40px_rgba(16,185,129,0.18)]"
        :class="animated ? '' : 'animate-none'"
      >
        <span class="completion-halo absolute inset-0 rounded-full" :class="animated ? '' : 'animate-none opacity-0'" />
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" class="completion-check relative z-10 h-12 w-12 text-emerald-600">
          <path
            d="M18 33L28 43L46 21"
            stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            pathLength="1"
            :class="animated ? '' : 'completion-check-static'"
          />
        </svg>
      </div>

      <p class="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
        {{ eyebrow }}
      </p>
      <h2 class="mt-3 font-[var(--font-display)] text-[2.2rem] font-bold tracking-[-0.05em] text-slate-950">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-3 max-w-xs text-sm leading-6 text-slate-700">
        {{ description }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  animated?: boolean
  animationSeed?: number
  eyebrow?: string
  title?: string
  description?: string
}>(), {
  animated: false,
  animationSeed: 0,
  eyebrow: 'Verification terminee',
  title: 'Test valide',
  description: ''
})
</script>

<style scoped>
.completion-badge {
  animation: completion-pop 680ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.completion-halo {
  animation: completion-halo 1.4s ease-out;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 45%, rgba(16, 185, 129, 0) 72%);
}

.completion-check path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: completion-draw 680ms 120ms ease forwards;
}

.completion-check-static {
  stroke-dashoffset: 0;
  animation: none;
}

@keyframes completion-pop {
  0% {
    opacity: 0;
    transform: scale(0.74);
  }

  60% {
    opacity: 1;
    transform: scale(1.06);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes completion-halo {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }

  30% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes completion-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
