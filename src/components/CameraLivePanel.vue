<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)]">
      <div class="relative overflow-hidden bg-slate-950">
        <video
          ref="videoElement"
          class="aspect-[3/4] w-full object-cover"
          autoplay
          playsinline
          muted
          @loadedmetadata="handlePreviewReady"
          @canplay="handlePreviewReady"
          @playing="handlePreviewReady"
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
        <div
          v-if="activeDeviceLabel"
          class="pointer-events-none absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm"
        >
          {{ activeDeviceLabel }}
        </div>
      </div>
    </div>

    <div v-if="showDeviceSelector && availableDevices.length > 1" class="space-y-2">
      <label class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500" for="camera-device">
        Choisir l'objectif
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
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Photo prise</p>
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
  'switch-device': [deviceId: string]
  'preview-ready-change': [ready: boolean]
}>()

const videoElement = ref<HTMLVideoElement | null>(null)

watch(
  [() => props.stream, videoElement],
  ([stream, element]) => {
    if (!element) {
      return
    }

    emit('preview-ready-change', false)
    element.srcObject = stream

    if (stream) {
      void element.play().catch(() => undefined)
      return
    }

    element.pause()
  },
  { immediate: true }
)

const onDeviceChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value

  if (!value) {
    return
  }

  emit('switch-device', value)
}

const handlePreviewReady = () => {
  if (!videoElement.value) {
    return
  }

  emit(
    'preview-ready-change',
    (videoElement.value.videoWidth > 0 && videoElement.value.videoHeight > 0) ||
      videoElement.value.readyState >= 2
  )
}

defineExpose({
  videoElement
})
</script>
