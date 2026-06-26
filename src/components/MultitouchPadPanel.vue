<template>
  <section
    ref="padRef"
    class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4 touch-none"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @touchstart.prevent="handleTouchStart"
    @touchmove.prevent="handleTouchMove"
    @touchend.prevent="handleTouchEnd"
    @touchcancel.prevent="handleTouchEnd"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ title }}</p>
        <p class="mt-1 text-sm text-slate-600">{{ hint }}</p>
      </div>
      <p class="shrink-0 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {{ activeTouches }} actif{{ activeTouches > 1 ? 's' : '' }}
      </p>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 border-t border-stone-300/80 pt-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Actifs</p>
        <p class="mt-1 text-3xl font-bold text-slate-950">{{ activeTouches }}</p>
      </div>
      <div class="text-right">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Maximum</p>
        <p class="mt-1 text-3xl font-bold text-slate-950">{{ maxTouches }}</p>
      </div>
    </div>

    <div class="mt-4 grid min-h-64 place-items-center rounded-[20px] border border-dashed border-stone-400 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.06)_0,_rgba(15,23,42,0.06)_2px,_transparent_2px)] [background-size:22px_22px]">
      <div class="space-y-3 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-stone-400 bg-white/80">
          <span class="text-2xl text-slate-950">+</span>
        </div>
        <p class="max-w-xs text-sm font-medium text-slate-700">
          Pose 2 puis 3 doigts ensemble.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  hint: string
  activeTouches: number
  maxTouches: number
}>()

const emit = defineEmits<{
  track: [payload: { activeTouches: number; maxTouches: number }]
}>()

const activePointerIds = new Set<string>()

const emitCounts = () => {
  emit('track', {
    activeTouches: activePointerIds.size,
    maxTouches: Math.max(props.maxTouches, activePointerIds.size)
  })
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  activePointerIds.add(`pointer-${event.pointerId}`)
  emitCounts()
}

const handlePointerMove = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || event.buttons === 0) {
    return
  }

  activePointerIds.add(`pointer-${event.pointerId}`)
  emitCounts()
}

const handlePointerUp = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  activePointerIds.delete(`pointer-${event.pointerId}`)
  emitCounts()
}

const handleTouchStart = (event: TouchEvent) => {
  activePointerIds.clear()
  for (const touch of Array.from(event.touches)) {
    activePointerIds.add(String(touch.identifier))
  }
  emitCounts()
}

const handleTouchMove = (event: TouchEvent) => {
  activePointerIds.clear()
  for (const touch of Array.from(event.touches)) {
    activePointerIds.add(String(touch.identifier))
  }
  emitCounts()
}

const handleTouchEnd = (event: TouchEvent) => {
  activePointerIds.clear()
  for (const touch of Array.from(event.touches)) {
    activePointerIds.add(String(touch.identifier))
  }
  emitCounts()
}
</script>
