<template>
  <div class="space-y-2.5">
    <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
      <span>Avancement</span>
      <span>{{ model.completed }}/{{ model.total }}</span>
    </div>
    <div class="flex h-12 items-stretch gap-2">
      <div
        v-for="block in model.blocks"
        :key="block.id"
        class="overflow-hidden rounded-2xl border transition-all duration-300"
        :class="getBlockClass(block)"
        :style="getBlockStyle(block)"
        :aria-label="block.label"
      >
        <div v-if="block.expanded" class="flex h-full items-center gap-2 px-3">
          <span
            class="grid h-7 w-7 shrink-0 place-items-center rounded-[10px]"
            :class="getIconWrapClass(block)"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              class="h-4 w-4"
              v-html="getIconPath(block.id)"
            />
          </span>
          <span
            class="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-inherit"
          >
            {{ block.label }}
          </span>
          <div class="flex min-w-0 flex-1 items-center gap-1">
            <div
              v-for="subStep in block.subSteps"
              :key="subStep.id"
              class="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/55"
            >
              <div
                class="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                :class="getSubStepFillClass(subStep.state)"
                :style="{ width: getSubStepFillWidth(subStep.state) }"
              />
            </div>
          </div>
        </div>

        <div v-else class="grid h-full w-full place-items-center">
          <span
            class="grid h-7 w-7 place-items-center rounded-[10px]"
            :class="getIconWrapClass(block)"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              class="h-4 w-4"
              v-html="getIconPath(block.id)"
            />
          </span>
          <span class="sr-only">{{ block.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProgressBlock, ProgressModel, ProgressSubStepState } from '../lib/productPresentation'

defineProps<{
  model: ProgressModel
}>()

const getBlockClass = (block: ProgressBlock) => {
  if (block.state === 'completed') {
    return 'border-slate-950 bg-slate-950 text-white'
  }

  if (block.state === 'current') {
    return 'border-slate-950/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.02))] text-slate-950'
  }

  return 'border-stone-300/80 bg-stone-100/90 text-slate-600'
}

const getIconWrapClass = (block: ProgressBlock) => {
  if (block.state === 'completed') {
    return 'bg-white/14 text-white'
  }

  if (block.state === 'current') {
    return 'bg-slate-950 text-white'
  }

  return 'bg-white text-slate-500'
}

const getBlockStyle = (block: ProgressBlock) => {
  if (block.expanded) {
    return {
      flex: '1 1 auto',
      minWidth: '0'
    }
  }

  return {
    flex: '0 0 2.75rem',
    width: '2.75rem'
  }
}

const getIconPath = (blockId: string) => {
  if (blockId === 'screen') {
    return '<rect x="3" y="4" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 16h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  }

  if (blockId === 'movement') {
    return '<path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 3l2 2M10 3L8 5M17 10l-2 2M17 10l-2-2M10 17l2-2M10 17l-2-2M3 10l2 2M3 10l2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
  }

  if (blockId === 'sound') {
    return '<path d="M7 8H4v4h3l4 3V5L7 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.5 7.5a3.5 3.5 0 010 5M15.5 5.5a6 6 0 010 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  }

  if (blockId === 'camera') {
    return '<rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="11" r="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M7 6l1-2h4l1 2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
  }

  return '<path d="M10 17s4.5-4.2 4.5-8A4.5 4.5 0 105.5 9c0 3.8 4.5 8 4.5 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="10" cy="9" r="1.6" fill="currentColor"/>'
}

const getSubStepFillClass = (state: ProgressSubStepState) => {
  if (state === 'completed') {
    return 'bg-slate-950'
  }

  if (state === 'current') {
    return 'bg-slate-950/55'
  }

  return 'bg-transparent'
}

const getSubStepFillWidth = (state: ProgressSubStepState) => {
  if (state === 'completed') {
    return '100%'
  }

  if (state === 'current') {
    return '48%'
  }

  return '0%'
}
</script>
