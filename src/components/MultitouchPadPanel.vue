<template>
  <div class="space-y-4">
    <div class="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ title }}</p>
      <p class="mt-2 text-sm leading-6 text-slate-600">{{ hint }}</p>
    </div>

    <div
      ref="padRef"
      class="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm touch-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @touchstart.prevent="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend.prevent="handleTouchEnd"
      @touchcancel.prevent="handleTouchEnd"
    >
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl bg-white/10 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Actifs</p>
          <p class="mt-1 text-3xl font-bold">{{ activeTouches }}</p>
        </div>
        <div class="rounded-2xl bg-white/10 px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Maximum</p>
          <p class="mt-1 text-3xl font-bold">{{ maxTouches }}</p>
        </div>
      </div>

      <div class="mt-5 flex min-h-48 items-center justify-center rounded-[28px] border border-dashed border-white/20 bg-white/5">
        <p class="max-w-xs text-center text-sm text-slate-300">
          Pose plusieurs doigts en meme temps sur cette zone pour faire monter le compteur.
        </p>
      </div>
    </div>
  </div>
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
