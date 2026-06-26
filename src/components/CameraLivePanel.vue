<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)]">
      <div class="flex items-start justify-between gap-3 border-b border-stone-300/80 px-4 py-3">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Camera active</p>
          <p class="mt-1 text-sm font-medium text-slate-700">{{ activeDeviceLabel }}</p>
        </div>
        <span class="rounded-full bg-stone-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
          live
        </span>
      </div>
      <div class="relative overflow-hidden bg-slate-950">
      <video
        ref="videoElement"
        class="aspect-[3/4] w-full object-cover"
        autoplay
        playsinline
        muted
      />
      <div
        v-if="showTarget"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div class="flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/80 bg-white/10 backdrop-blur-[1px]">
          <span class="max-w-[8rem] text-center text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {{ targetLabel }}
          </span>
        </div>
      </div>
      </div>
    </div>

    <div v-if="showDeviceSelector && availableDevices.length > 1" class="space-y-2">
      <label class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500" for="camera-device">
        Objectif
      </label>
      <select
        id="camera-device"
        class="w-full rounded-[18px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        :value="selectedDeviceId ?? ''"
        @change="onDeviceChange"
      >
        <option v-for="device in availableDevices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label }}
        </option>
      </select>
    </div>

    <div v-if="previewUrl" class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Derniere capture</p>
      <img :src="previewUrl" alt="Capture de test" class="mt-3 rounded-2xl border border-stone-300/80 object-cover" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CameraDeviceInfo } from '../composables/useCameraMedia'

const props = defineProps<{
  stream: MediaStream | null
  previewUrl: string | null
  activeDeviceLabel: string
  availableDevices: CameraDeviceInfo[]
  selectedDeviceId: string | null
  showDeviceSelector?: boolean
  showTarget?: boolean
  targetLabel?: string
}>()

const emit = defineEmits<{
  switchDevice: [deviceId: string]
}>()

const videoElement = ref<HTMLVideoElement | null>(null)

watch(
  [() => props.stream, videoElement],
  ([stream, element]) => {
    if (!element) {
      return
    }

    element.srcObject = stream

    if (stream) {
      void element.play().catch(() => undefined)
    }
  },
  { immediate: true }
)

const onDeviceChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value

  if (!value) {
    return
  }

  emit('switchDevice', value)
}

defineExpose({
  videoElement
})
</script>
