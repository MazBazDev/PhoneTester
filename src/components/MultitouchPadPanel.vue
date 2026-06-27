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
    <div class="mb-4 flex items-center justify-between gap-3">
      <p class="text-sm text-slate-600">{{ hint }}</p>
      <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">
        {{ maxTouches }} max
      </span>
    </div>

    <div class="grid min-h-72 place-items-center rounded-[20px] border border-dashed border-stone-400 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.06)_0,_rgba(15,23,42,0.06)_2px,_transparent_2px)] [background-size:22px_22px]">
      <div class="space-y-3 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-stone-400 bg-white/80">
          <span class="text-xl font-semibold text-slate-950">{{ activeTouches }}</span>
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
