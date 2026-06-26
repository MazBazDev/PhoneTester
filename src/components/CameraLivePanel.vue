<template>
  <div class="space-y-4">
    <div class="relative overflow-hidden rounded-[28px] bg-slate-950">
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
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-4 py-4 text-white">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">Camera active</p>
        <p class="mt-1 text-sm font-semibold">{{ activeDeviceLabel }}</p>
      </div>
    </div>

    <div v-if="showDeviceSelector && availableDevices.length > 1" class="space-y-2">
      <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" for="camera-device">
        Objectif
      </label>
      <select
        id="camera-device"
        class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        :value="selectedDeviceId ?? ''"
        @change="onDeviceChange"
      >
        <option v-for="device in availableDevices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label }}
        </option>
      </select>
    </div>

    <div v-if="previewUrl" class="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Derniere capture</p>
      <img :src="previewUrl" alt="Capture de test" class="mt-3 rounded-2xl border border-slate-200 object-cover" />
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
