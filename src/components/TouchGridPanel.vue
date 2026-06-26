<template>
  <div
    ref="stageRef"
    data-testid="touch-stage"
    class="grid h-full w-full overflow-hidden bg-stone-100 select-none"
    :class="immersive ? 'touch-none' : 'aspect-[7/12] rounded-[28px] border border-stone-300 touch-none'"
    :style="stageStyle"
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
      class="min-h-0 min-w-0 border border-stone-400/80 transition-colors duration-100"
      :style="
        visitedCellSet.has(cellId)
          ? {
              backgroundColor: '#22c55e',
              borderColor: '#15803d'
            }
          : {
              backgroundColor: '#f5f5f4'
            }
      "
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface CellCoords {
  row: number
  col: number
}

interface ContactPoint {
  id: string
  clientX: number
  clientY: number
}

const props = defineProps<{
  cols: number
  rows: number
  visitedCellIds: string[]
  immersive?: boolean
}>()

const emit = defineEmits<{
  track: [payload: { cellIds: string[] }]
  tap: []
}>()

const TAP_WINDOW_MS = 220

const stageRef = ref<HTMLElement | null>(null)
const previousCells = new Map<string, CellCoords>()
const pressStartedAt = new Map<string, number>()
const activeContacts = new Set<string>()

const visitedCellSet = computed(() => new Set(props.visitedCellIds))
const cellIds = computed(() =>
  Array.from({ length: props.rows * props.cols }, (_, index) => {
    const row = Math.floor(index / props.cols)
    const col = index % props.cols
    return `${row}-${col}`
  })
)
const stageStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${props.rows}, minmax(0, 1fr))`,
  touchAction: 'none'
}))

const buildCellId = (row: number, col: number) => `${row}-${col}`

const resolveCell = (clientX: number, clientY: number): CellCoords | null => {
  const stage = stageRef.value

  if (!stage) {
    return null
  }

  const rect = stage.getBoundingClientRect()

  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }

  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null
  }

  const col = Math.min(props.cols - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * props.cols)))
  const row = Math.min(props.rows - 1, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * props.rows)))

  return { row, col }
}

const interpolate = (from: CellCoords | null, to: CellCoords): string[] => {
  if (!from) {
    return [buildCellId(to.row, to.col)]
  }

  const rowDelta = to.row - from.row
  const colDelta = to.col - from.col
  const steps = Math.max(Math.abs(rowDelta), Math.abs(colDelta))

  if (steps === 0) {
    return [buildCellId(to.row, to.col)]
  }

  const visited: string[] = []

  for (let index = 0; index <= steps; index += 1) {
    const row = Math.round(from.row + (rowDelta * index) / steps)
    const col = Math.round(from.col + (colDelta * index) / steps)
    visited.push(buildCellId(row, col))
  }

  return visited
}

const emitVisitedCells = (points: ContactPoint[]) => {
  const nextCellIds = points.flatMap((point) => {
    const current = resolveCell(point.clientX, point.clientY)

    if (!current) {
      return []
    }

    const previous = previousCells.get(point.id) ?? null
    previousCells.set(point.id, current)
    return interpolate(previous, current)
  })

  const cellIds = Array.from(new Set(nextCellIds))

  if (cellIds.length > 0) {
    emit('track', { cellIds })
  }
}

const maybeEmitTap = (id: string) => {
  const startedAt = pressStartedAt.get(id)

  if (typeof startedAt === 'number' && Date.now() - startedAt <= TAP_WINDOW_MS) {
    emit('tap')
  }

  activeContacts.delete(id)
  pressStartedAt.delete(id)
  previousCells.delete(id)
}

const handlePointerDown = (event: PointerEvent) => {
  const id = `pointer-${event.pointerId}`
  activeContacts.add(id)
  pressStartedAt.set(id, Date.now())
  if (typeof (event.currentTarget as HTMLElement | null)?.setPointerCapture === 'function') {
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }
  emitVisitedCells([{ id, clientX: event.clientX, clientY: event.clientY }])
}

const handlePointerMove = (event: PointerEvent) => {
  const id = `pointer-${event.pointerId}`

  if (!activeContacts.has(id)) {
    return
  }

  emitVisitedCells([{ id, clientX: event.clientX, clientY: event.clientY }])
}

const handlePointerUp = (event: PointerEvent) => {
  const id = `pointer-${event.pointerId}`
  maybeEmitTap(id)
}

const handleTouchStart = (event: TouchEvent) => {
  for (const touch of Array.from(event.changedTouches)) {
    const id = `touch-${touch.identifier}`
    activeContacts.add(id)
    pressStartedAt.set(id, Date.now())
  }

  emitVisitedCells(
    Array.from(event.touches).map((touch) => ({
      id: `touch-${touch.identifier}`,
      clientX: touch.clientX,
      clientY: touch.clientY
    }))
  )
}

const handleTouchMove = (event: TouchEvent) => {
  emitVisitedCells(
    Array.from(event.touches).map((touch) => ({
      id: `touch-${touch.identifier}`,
      clientX: touch.clientX,
      clientY: touch.clientY
    }))
  )
}

const handleTouchEnd = (event: TouchEvent) => {
  for (const touch of Array.from(event.changedTouches)) {
    maybeEmitTap(`touch-${touch.identifier}`)
  }
}
</script>
