<template>
  <div class="space-y-4" :class="immersive ? 'flex h-full flex-col' : ''">
    <div
      ref="gridRef"
      class="grid touch-none overflow-hidden shadow-inner"
      :class="immersive ? 'h-full flex-1 rounded-none border-0 bg-white' : 'aspect-[5/8] rounded-[32px] border border-slate-200 bg-white'"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      @pointerdown="handlePointer"
      @pointermove="handlePointer"
      @touchstart.prevent="handleTouchEvent"
      @touchmove.prevent="handleTouchEvent"
    >
      <div
        v-for="cellId in cellIds"
        :key="cellId"
        class="relative border border-slate-100 transition-colors duration-150"
        :class="cellClass(cellId)"
      >
        <div
          v-if="cellId === exitCellId"
          class="pointer-events-none absolute inset-1 flex items-center justify-center rounded-xl border border-dashed text-center text-[10px] font-semibold uppercase tracking-[0.12em]"
          :class="visitedCellSet.has(cellId) ? 'border-white/60 text-white' : 'border-slate-400 text-slate-500'"
        >
          x2 sortie
        </div>
      </div>
    </div>

    <div v-if="!immersive" class="grid grid-cols-2 gap-3">
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
  immersive?: boolean
  exitCellId?: string
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

const cellClass = (cellId: string) => {
  if (visitedCellSet.value.has(cellId)) {
    return 'bg-orange-500'
  }

  if (cellId === props.exitCellId) {
    return 'bg-slate-200'
  }

  return 'bg-slate-50'
}

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
