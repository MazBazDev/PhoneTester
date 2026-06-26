<template>
  <div class="space-y-4">
    <div
      ref="gridRef"
      class="grid aspect-[5/8] touch-none overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-inner"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      @pointerdown="handlePointer"
      @pointermove="handlePointer"
      @touchstart.prevent="handleTouchEvent"
      @touchmove.prevent="handleTouchEvent"
    >
      <div
        v-for="cellId in cellIds"
        :key="cellId"
        class="border border-slate-100 transition-colors duration-150"
        :class="visitedCellSet.has(cellId) ? 'bg-orange-500' : 'bg-slate-50'"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Couverture</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">{{ coveragePercent }}%</p>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Multitouch</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">{{ maxSimultaneousTouches }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  cols: number
  rows: number
  visitedCellIds: string[]
  coveragePercent: number
  maxSimultaneousTouches: number
}>()

const emit = defineEmits<{
  track: [payload: { cellIds: string[]; simultaneousTouches: number }]
}>()

const gridRef = ref<HTMLElement | null>(null)

const visitedCellSet = computed(() => new Set(props.visitedCellIds))
const cellIds = computed(() =>
  Array.from({ length: props.rows * props.cols }, (_, index) => {
    const row = Math.floor(index / props.cols)
    const col = index % props.cols
    return `${row}-${col}`
  })
)

const resolveCellId = (clientX: number, clientY: number) => {
  const grid = gridRef.value

  if (!grid) {
    return null
  }

  const rect = grid.getBoundingClientRect()

  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null
  }

  const col = Math.min(props.cols - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * props.cols)))
  const row = Math.min(props.rows - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * props.rows)))

  return `${row}-${col}`
}

const emitTracking = (points: Array<{ clientX: number; clientY: number }>, simultaneousTouches: number) => {
  const cellIds = points
    .map((point) => resolveCellId(point.clientX, point.clientY))
    .filter((value): value is string => Boolean(value))

  if (cellIds.length === 0) {
    return
  }

  emit('track', {
    cellIds,
    simultaneousTouches
  })
}

const handlePointer = (event: PointerEvent) => {
  if (event.type === 'pointermove' && event.buttons === 0) {
    return
  }

  emitTracking([{ clientX: event.clientX, clientY: event.clientY }], 1)
}

const handleTouchEvent = (event: TouchEvent) => {
  emitTracking(
    Array.from(event.touches).map((touch) => ({
      clientX: touch.clientX,
      clientY: touch.clientY
    })),
    event.touches.length
  )
}
</script>
