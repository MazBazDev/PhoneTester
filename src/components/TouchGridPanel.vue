<template>
  <div class="space-y-4" :class="immersive ? 'flex h-full flex-col' : ''">
    <div
      ref="gridRef"
      class="grid overflow-hidden border border-slate-200 bg-white shadow-inner"
      :class="immersive ? 'h-full flex-1 rounded-none touch-none' : 'aspect-[7/12] rounded-[32px] touch-none'"
      :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @touchstart.prevent="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend.prevent="handleTouchEnd"
      @touchcancel.prevent="handleTouchEnd"
    >
      <div
        v-for="cellId in cellIds"
        :key="cellId"
        class="border border-slate-100 transition-colors duration-100"
        :class="visitedCellSet.has(cellId) ? 'bg-orange-500' : 'bg-slate-50'"
      />
    </div>

    <div v-if="!immersive" class="grid grid-cols-2 gap-3">
      <div class="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Couverture</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">{{ coveragePercent }}%</p>
      </div>
      <div class="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cellules</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">{{ visitedCellIds.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface CellCoords {
  row: number
  col: number
}

interface PointPayload {
  id: string
  clientX: number
  clientY: number
}

const props = defineProps<{
  cols: number
  rows: number
  visitedCellIds: string[]
  coveragePercent: number
  immersive?: boolean
}>()

const emit = defineEmits<{
  track: [payload: { cellIds: string[]; simultaneousTouches: number }]
  tap: []
}>()

const gridRef = ref<HTMLElement | null>(null)
const activePointers = new Map<string, CellCoords>()
const activeTouches = new Map<number, CellCoords>()
const pointerDownAt = new Map<string, number>()
const touchDownAt = new Map<number, number>()

const visitedCellSet = computed(() => new Set(props.visitedCellIds))
const cellIds = computed(() =>
  Array.from({ length: props.rows * props.cols }, (_, index) => {
    const row = Math.floor(index / props.cols)
    const col = index % props.cols
    return `${row}-${col}`
  })
)

const buildCellId = ({ row, col }: CellCoords) => `${row}-${col}`

const resolveCellCoords = (clientX: number, clientY: number): CellCoords | null => {
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

  return { row, col }
}

const interpolateCells = (from: CellCoords | null, to: CellCoords): string[] => {
  if (!from) {
    return [buildCellId(to)]
  }

  const cells: string[] = []
  const rowDelta = to.row - from.row
  const colDelta = to.col - from.col
  const steps = Math.max(Math.abs(rowDelta), Math.abs(colDelta))

  if (steps === 0) {
    return [buildCellId(to)]
  }

  for (let index = 0; index <= steps; index += 1) {
    const row = Math.round(from.row + (rowDelta * index) / steps)
    const col = Math.round(from.col + (colDelta * index) / steps)
    cells.push(buildCellId({ row, col }))
  }

  return cells
}

const emitTracking = (points: PointPayload[], simultaneousTouches: number, store: Map<string | number, CellCoords>) => {
  const nextCellIds = points.flatMap((point) => {
    const previous = store.get(point.id)
    const current = resolveCellCoords(point.clientX, point.clientY)

    if (!current) {
      return []
    }

    store.set(point.id, current)
    return interpolateCells(previous ?? null, current)
  })

  const cellIds = Array.from(new Set(nextCellIds))

  if (cellIds.length === 0) {
    return
  }

  emit('track', {
    cellIds,
    simultaneousTouches
  })
}

const maybeEmitTap = (startedAt: number | undefined) => {
  if (typeof startedAt !== 'number') {
    return
  }

  if (Date.now() - startedAt <= 220) {
    emit('tap')
  }
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  const id = `pointer-${event.pointerId}`
  pointerDownAt.set(id, Date.now())
  emitTracking([{ id, clientX: event.clientX, clientY: event.clientY }], 1, activePointers)
}

const handlePointerMove = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || event.buttons === 0) {
    return
  }

  const id = `pointer-${event.pointerId}`
  emitTracking([{ id, clientX: event.clientX, clientY: event.clientY }], 1, activePointers)
}

const handlePointerUp = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  const id = `pointer-${event.pointerId}`
  maybeEmitTap(pointerDownAt.get(id))
  pointerDownAt.delete(id)
  activePointers.delete(id)
}

const handleTouchStart = (event: TouchEvent) => {
  for (const touch of Array.from(event.changedTouches)) {
    touchDownAt.set(touch.identifier, Date.now())
  }

  emitTracking(
    Array.from(event.touches).map((touch) => ({
      id: String(touch.identifier),
      clientX: touch.clientX,
      clientY: touch.clientY
    })),
    event.touches.length,
    activeTouches
  )
}

const handleTouchMove = (event: TouchEvent) => {
  emitTracking(
    Array.from(event.touches).map((touch) => ({
      id: String(touch.identifier),
      clientX: touch.clientX,
      clientY: touch.clientY
    })),
    event.touches.length,
    activeTouches
  )
}

const handleTouchEnd = (event: TouchEvent) => {
  for (const touch of Array.from(event.changedTouches)) {
    maybeEmitTap(touchDownAt.get(touch.identifier))
    touchDownAt.delete(touch.identifier)
    activeTouches.delete(touch.identifier)
  }
}
</script>
