<template>
  <div
    v-if="session && testDefinition && step"
    :class="screenImmersiveActive ? 'fixed inset-0 z-50 overflow-hidden bg-slate-950' : ''"
  >
    <template v-if="touchImmersiveActive && guidedState">
      <div class="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-stone-100">
        <TouchGridPanel
          :cols="touchCols"
          :rows="touchRows"
          :visited-cell-ids="touchVisitedCellIds"
          immersive
          @track="trackTouchGrid"
          @tap="trackTouchTap"
        />
      </div>
    </template>

    <AppShell
      v-else
      :eyebrow="testDefinition.mode === 'guided' ? 'Diagnostic guide' : 'Diagnostic automatique'"
      :title="testDefinition.name"
      :description="screenImmersiveActive ? '' : testDefinition.description"
      :progress="store.sessionProgress"
      :immersive="screenImmersiveActive"
    >
      <div class="space-y-4" :class="screenImmersiveActive ? 'flex min-h-[70vh] flex-col justify-between' : ''">
        <div
          v-if="!screenImmersiveActive"
          class="rounded-[20px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Test {{ currentIndex + 1 }} / {{ session.steps.length }}
              </p>
              <p class="mt-1 truncate text-sm text-slate-700">{{ helperText }}</p>
            </div>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" :class="badgeClass">
              {{ badgeLabel }}
            </span>
          </div>
        </div>

        <template v-if="testDefinition.mode === 'guided' && guidedState">
          <section
            v-if="props.testId === 'screen' && currentGuidedSubStep && guidedState.phase === 'active'"
            ref="screenPanelRef"
            class="flex flex-1 flex-col shadow-2xl"
            :class="[currentGuidedSubStep.tone, screenImmersiveActive ? 'min-h-[100dvh] rounded-none' : 'rounded-[32px] px-6 py-8']"
            :style="screenPanelStyle"
          >
            <div
              v-if="screenImmersiveActive"
              class="px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]"
            >
              <div class="inline-flex rounded-full bg-black/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                {{ guidedState.currentStepIndex + 1 }} / {{ guidedState.steps.length }}
              </div>
            </div>
            <template v-else>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                Ecran {{ guidedState.currentStepIndex + 1 }} / {{ guidedState.steps.length }}
              </p>
              <h2 class="mt-4 text-3xl font-bold">{{ currentGuidedSubStep.label }}</h2>
              <p class="mt-4 max-w-sm text-base leading-7 opacity-90">{{ currentGuidedSubStep.instruction }}</p>
            </template>
            <div
              class="flex flex-1"
              @dblclick="exitScreenFullscreen"
              @touchstart.passive="handleScreenProbeTouch"
            />
            <div
              class="mt-auto grid grid-cols-2 gap-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              :class="screenImmersiveActive ? 'bg-transparent' : ''"
            >
              <AppButton class="w-full" variant="secondary" @click="toggleScreenConcern">
                {{ currentScreenStepFlagged ? 'Doute marque' : 'Marquer un doute' }}
              </AppButton>
              <AppButton class="w-full" @click="advanceScreenStep">
                {{ isLastGuidedSubStep ? 'Terminer la sequence' : 'Couleur suivante' }}
              </AppButton>
            </div>
          </section>

          <section
            v-else-if="props.testId === 'touch' && guidedState.phase === 'active'"
            class="rounded-[32px] bg-slate-50/90 p-6"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grille tactile</p>
            <h2 class="mt-3 text-2xl font-bold text-slate-950">Couvre toute la surface</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Passe sur chaque case. En secours, 5 taps rapides terminent le test.
            </p>
            <div class="mt-5">
              <TouchGridPanel
                :cols="touchCols"
                :rows="touchRows"
                :visited-cell-ids="touchVisitedCellIds"
                @track="trackTouchGrid"
                @tap="trackTouchTap"
              />
            </div>
          </section>

          <section v-else-if="isMultitouchTest && guidedState.phase === 'active'">
            <MultitouchPadPanel
              title="Multitouch"
              hint="Monte le compteur avec plusieurs doigts poses en meme temps."
              :active-touches="multitouchActiveTouches"
              :max-touches="multitouchMaxSimultaneousTouches"
              @track="trackMultitouchPad"
            />
          </section>

          <section v-else-if="isSensorTest && guidedState.phase === 'active'">
            <SensorLivePanel
              :title="sensorPanelTitle"
              :hint="sensorPanelHint"
              :axis-entries="sensorAxisEntries"
              :info-entries="sensorInfoEntries"
              :phone-rotation="sensorPhoneRotation"
              :max-value="sensorMaxValue"
              :permission-state="sensorPermissionState"
              :variant="sensorPanelVariant"
              :compass-heading="compassHeading"
              :gps-status-label="gpsStatusLabel"
              :gps-main-value="gpsMainValue"
              :gps-secondary-label="gpsSecondaryLabel"
            />
          </section>

          <section v-else-if="isMicrophoneTest && guidedState.phase === 'active'">
            <MicrophoneLivePanel
              hint="Parle ou tapote pres du micro. Le niveau et le pic doivent reagir rapidement."
              :level="microphoneLevel"
              :peak-level="microphonePeakLevel"
              :sound-detected="microphoneSoundDetected"
              :permission-state="String(guidedState.metrics.permissionState ?? microphoneRuntime.permissionState.value)"
            />
          </section>

          <section v-else-if="isMediaTest && guidedState.phase === 'active'">
            <div class="mb-4 flex items-start justify-between gap-3 rounded-[20px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {{ isAutofocusTest ? 'Mise au point' : 'Camera' }}
                </p>
                <h2 class="mt-1 text-2xl font-bold text-slate-950">
                  {{ currentGuidedSubStep?.label || 'Verification camera' }}
                </h2>
                <p class="mt-1 text-sm text-slate-600">
                  {{ currentGuidedSubStep?.instruction || 'Observe le flux puis valide le comportement attendu.' }}
                </p>
              </div>
              <span class="shrink-0 rounded-full bg-stone-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                {{ isAutofocusTest ? 'guide' : 'live' }}
              </span>
            </div>
            <div class="mt-5">
              <CameraLivePanel
                ref="cameraPanelRef"
                :stream="cameraStream"
                :preview-url="currentCaptureUrl"
                :active-device-label="cameraActiveDeviceLabel"
                :available-devices="selectedCameraDevices"
                :selected-device-id="cameraActiveDeviceId"
                :show-device-selector="showRearDeviceSelector"
                :show-target="isAutofocusTest"
                :target-label="autofocusTargetLabel"
                @switch-device="switchRearDevice"
              />
            </div>
          </section>

            <AppCard v-else-if="guidedState.phase === 'confirm' || step.result">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Validation</p>
            <h2 class="mt-2 text-2xl font-bold text-slate-950">{{ confirmationTitle }}</h2>
            <p class="mt-2 text-sm text-slate-600">{{ confirmationText }}</p>

            <div v-if="props.testId === 'touch'" class="mt-5 grid grid-cols-2 gap-3">
              <div class="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Couverture</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ touchCoveragePercent }}%</p>
              </div>
              <div class="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mode de fin</p>
                <p class="mt-2 text-xl font-bold text-slate-950">
                  {{ guidedState.metrics.completedAutomatically ? 'automatique' : '5 taps' }}
                </p>
              </div>
            </div>

            <div v-else-if="isMultitouchTest" class="mt-5 grid grid-cols-2 gap-3">
              <div class="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actifs</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ multitouchActiveTouches }}</p>
              </div>
              <div class="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Maximum</p>
                <p class="mt-2 text-xl font-bold text-slate-950">{{ multitouchMaxSimultaneousTouches }}</p>
              </div>
            </div>

            <div
              v-else-if="isSensorTest && !step.result"
              class="mt-5 grid grid-cols-1 gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4"
            >
              <div
                v-for="entry in sensorInfoEntries"
                :key="entry.label"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-sm text-slate-600">{{ entry.label }}</span>
                <span class="text-sm font-semibold text-slate-950">{{ entry.value }}</span>
              </div>
            </div>

            <div
              v-else-if="isMicrophoneTest"
              class="mt-5 grid grid-cols-1 gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4"
            >
              <div
                v-for="entry in microphoneInfoEntries"
                :key="entry.label"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-sm text-slate-600">{{ entry.label }}</span>
                <span class="text-sm font-semibold text-slate-950">{{ entry.value }}</span>
              </div>
            </div>

            <div v-else-if="isMediaTest" class="mt-5 space-y-3">
              <div v-if="currentCaptureUrl" class="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capture</p>
                <img :src="currentCaptureUrl" alt="Capture du test camera" class="mt-3 rounded-2xl border border-slate-200 object-cover" />
              </div>
              <div class="grid grid-cols-1 gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div
                  v-for="entry in mediaInfoEntries"
                  :key="entry.label"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="text-sm text-slate-600">{{ entry.label }}</span>
                  <span class="text-sm font-semibold text-slate-950">{{ entry.value }}</span>
                </div>
              </div>
            </div>

            <div v-if="!step.result" class="mt-5 grid grid-cols-2 gap-3">
              <AppButton class="w-full" variant="secondary" @click="confirmGuided('warning')">Doute</AppButton>
              <AppButton class="w-full" @click="confirmGuided('pass')">Conforme</AppButton>
            </div>

            <div v-else class="mt-5 space-y-3">
              <div
                v-for="detail in step.result.details"
                :key="detail.label"
                class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span class="text-sm text-slate-600">{{ detail.label }}</span>
                <span class="text-right text-sm font-semibold text-slate-900">{{ detail.value }}</span>
              </div>
            </div>
          </AppCard>
        </template>

        <AppCard v-else-if="step.result">
          <p class="text-sm font-semibold text-slate-900">{{ step.result.summary }}</p>
          <div class="mt-4 space-y-3">
            <div
              v-for="detail in step.result.details"
              :key="detail.label"
              class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span class="text-sm text-slate-600">{{ detail.label }}</span>
              <span class="text-right text-sm font-semibold text-slate-900">{{ detail.value }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <template #actions>
        <AppButton class="flex-1" variant="secondary" @click="quitDiagnostic">Quitter</AppButton>

        <AppButton
          v-if="testDefinition.mode === 'automatic' && !step.result"
          class="flex-1"
          @click="runCurrentAutomaticTest"
        >
          Executer
        </AppButton>

        <AppButton
          v-else-if="testDefinition.mode === 'guided' && guidedState?.phase === 'idle'"
          class="flex-1"
          @click="launchGuidedTest"
        >
          {{ launchButtonLabel }}
        </AppButton>

        <AppButton
          v-else-if="isMultitouchTest && guidedState?.phase === 'active'"
          class="flex-1"
          @click="finishMultitouchCollection"
        >
          Passer a la validation
        </AppButton>

        <AppButton
          v-else-if="isSensorTest && guidedState?.phase === 'active'"
          class="flex-1"
          @click="finishSensorCollection"
        >
          Passer a la validation
        </AppButton>

        <AppButton
          v-else-if="isMicrophoneTest && guidedState?.phase === 'active'"
          class="flex-1"
          @click="finishMicrophoneCollection"
        >
          Passer a la validation
        </AppButton>

        <AppButton
          v-else-if="isMediaTest && guidedState?.phase === 'active'"
          class="flex-1"
          @click="handleMediaPrimaryAction"
        >
          {{ mediaPrimaryActionLabel }}
        </AppButton>

        <AppButton v-else-if="step.result" class="flex-1" @click="goNext">
          {{ nextStep ? 'Suivant' : 'Resume' }}
        </AppButton>
      </template>
    </AppShell>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppCard from '../components/AppCard.vue'
import AppShell from '../components/AppShell.vue'
import CameraLivePanel from '../components/CameraLivePanel.vue'
import MicrophoneLivePanel from '../components/MicrophoneLivePanel.vue'
import MultitouchPadPanel from '../components/MultitouchPadPanel.vue'
import SensorLivePanel from '../components/SensorLivePanel.vue'
import TouchGridPanel from '../components/TouchGridPanel.vue'
import { useCameraMedia, type CameraDeviceInfo } from '../composables/useCameraMedia'
import { useMicrophoneLevel } from '../composables/useMicrophoneLevel'
import {
  useMotionSensors,
  type MotionPermissionState,
  type SensorMode,
  type RotationSample,
  type AccelerometerSample,
  type GyroscopeSample,
  type CompassSample,
  type GpsSample,
  type SensorError
} from '../composables/useMotionSensors'
import type { DiagnosticGuidedUserVerdict } from '../domain/diagnostic'
import { clearSessionCapture, getSessionCapture, setSessionCapture } from '../lib/sessionMedia'
import { useDiagnosticStore } from '../stores/diagnostic'

const props = defineProps<{
  sessionId: string
  testId: string
}>()

const router = useRouter()
const store = useDiagnosticStore()
const sensorRuntime = useMotionSensors()
const cameraRuntime = useCameraMedia()
const microphoneRuntime = useMicrophoneLevel()
const cameraPanelRef = ref<{ videoElement: HTMLVideoElement | null } | null>(null)
const screenPanelRef = ref<HTMLElement | null>(null)
const lastScreenProbeTapAt = ref(0)
const lastTouchTapAt = ref(0)
const touchTapCount = ref(0)
const launchInFlight = ref(false)
const autoStartedTestKey = ref<string | null>(null)

const session = computed(() => store.getSessionById(props.sessionId))
const testDefinition = computed(() => store.getTestDefinition(props.testId))
const step = computed(() => store.getStepByTestId(props.sessionId, props.testId))
const nextStep = computed(() => store.getNextStep(props.sessionId, props.testId))
const currentIndex = computed(() => session.value?.steps.findIndex((entry) => entry.testId === props.testId) ?? 0)
const guidedState = computed(() => step.value?.guidedState ?? null)
const currentGuidedSubStep = computed(() => store.getCurrentGuidedSubStep(props.sessionId, props.testId))
const isSensorTest = computed(() =>
  ['rotation', 'accelerometer', 'gyroscope', 'compass', 'gps'].includes(props.testId)
)
const isCameraCaptureTest = computed(() => ['camera-rear', 'camera-front'].includes(props.testId))
const isAutofocusTest = computed(() => props.testId === 'autofocus')
const isMicrophoneTest = computed(() => props.testId === 'microphone')
const isMultitouchTest = computed(() => props.testId === 'multitouch')
const isMediaTest = computed(() => isCameraCaptureTest.value || isAutofocusTest.value)
const sensorMode = computed<SensorMode | null>(() => {
  if (['rotation', 'accelerometer', 'gyroscope', 'compass', 'gps'].includes(props.testId)) {
    return props.testId as SensorMode
  }

  return null
})
const rearVideoDevices = computed(() => {
  const rear = cameraRuntime.availableVideoDevices.value.filter((device) => device.facing === 'rear')
  return rear.length > 0 ? rear : cameraRuntime.availableVideoDevices.value
})
const frontVideoDevices = computed(() => {
  const front = cameraRuntime.availableVideoDevices.value.filter((device) => device.facing === 'front')
  return front.length > 0 ? front : cameraRuntime.availableVideoDevices.value
})
const cameraStream = computed(() => cameraRuntime.activeStream.value)
const cameraActiveDeviceId = computed(() => cameraRuntime.activeDeviceId.value)
const cameraActiveDeviceLabel = computed(() => cameraRuntime.activeDeviceLabel.value)
const selectedCameraDevices = computed<CameraDeviceInfo[]>(() => {
  if (props.testId === 'camera-front') {
    return frontVideoDevices.value
  }

  return rearVideoDevices.value
})
const showRearDeviceSelector = computed(
  () => props.testId === 'camera-rear' && selectedCameraDevices.value.length > 1
)
const currentCaptureUrl = computed(() => getSessionCapture(props.sessionId, props.testId))
const currentAutofocusStepId = computed(() => currentGuidedSubStep.value?.id ?? null)
const flaggedScreenStepIds = computed(() => {
  const value = guidedState.value?.metrics.flaggedStepIds
  return Array.isArray(value) ? value : []
})
const currentScreenStepFlagged = computed(() =>
  Boolean(currentGuidedSubStep.value?.id && flaggedScreenStepIds.value.includes(currentGuidedSubStep.value.id))
)
const isLastGuidedSubStep = computed(() => {
  if (!guidedState.value) {
    return false
  }

  return guidedState.value.currentStepIndex >= guidedState.value.steps.length - 1
})
const requiresSystemPermission = computed(() =>
  ['rotation', 'accelerometer', 'gyroscope', 'compass', 'gps', 'camera-rear', 'camera-front', 'autofocus', 'microphone'].includes(
    props.testId
  )
)
const autofocusTargetLabel = computed(() => {
  if (currentAutofocusStepId.value === 'autofocus-near') {
    return 'Cible proche'
  }

  if (currentAutofocusStepId.value === 'autofocus-far') {
    return 'Cible loin'
  }

  return 'Mise au point'
})
const touchImmersiveActive = computed(
  () => Boolean(testDefinition.value?.immersive && guidedState.value?.phase === 'active' && props.testId === 'touch')
)
const screenImmersiveActive = computed(
  () => Boolean(testDefinition.value?.immersive && guidedState.value?.phase === 'active' && props.testId === 'screen')
)
const screenPanelStyle = computed(() => ({
  backgroundColor: currentGuidedSubStep.value?.color || '#ffffff',
  paddingTop: screenImmersiveActive.value ? '0' : undefined,
  paddingBottom: screenImmersiveActive.value ? '0' : undefined
}))

const touchRows = computed(() => Number(guidedState.value?.metrics.rows ?? 12))
const touchCols = computed(() => Number(guidedState.value?.metrics.cols ?? 7))
const touchVisitedCellIds = computed(() => {
  const value = guidedState.value?.metrics.visitedCellIds
  return Array.isArray(value) ? value : []
})
const touchCoveragePercent = computed(() => Number(guidedState.value?.metrics.coveragePercent ?? 0))
const multitouchActiveTouches = computed(() => Number(guidedState.value?.metrics.activeTouches ?? 0))
const multitouchMaxSimultaneousTouches = computed(() => Number(guidedState.value?.metrics.maxSimultaneousTouches ?? 0))
const microphoneLevel = computed(() => Number(guidedState.value?.metrics.level ?? microphoneRuntime.level.value))
const microphonePeakLevel = computed(() => Number(guidedState.value?.metrics.peakLevel ?? microphoneRuntime.peakLevel.value))
const microphoneSoundDetected = computed(() => Boolean(guidedState.value?.metrics.soundDetected))

const sensorPermissionState = computed<MotionPermissionState | string>(
  () => String(guidedState.value?.metrics.permissionState ?? sensorRuntime.permissionState.value)
)

const compassHeading = computed(() =>
  typeof guidedState.value?.metrics.heading === 'number' ? Number(guidedState.value?.metrics.heading) : null
)

const gpsStatusLabel = computed(() => {
  if (Boolean(guidedState.value?.metrics.acquired)) {
    return 'Position acquise'
  }

  if (guidedState.value?.metrics.acquisitionError) {
    return String(guidedState.value.metrics.acquisitionError)
  }

  return 'Recherche de position'
})

const gpsMainValue = computed(() => {
  if (Boolean(guidedState.value?.metrics.acquired)) {
    return `${Number(guidedState.value?.metrics.accuracy ?? 0).toFixed(0)} m`
  }

  return '...'
})

const gpsSecondaryLabel = computed(() => {
  if (typeof guidedState.value?.metrics.acquiredInMs === 'number') {
    return `Temps d’acquisition: ${Math.round(Number(guidedState.value.metrics.acquiredInMs))} ms`
  }

  return 'Attente du premier fix GPS'
})

const sensorPanelVariant = computed<'sensor' | 'compass' | 'gps'>(() => {
  if (props.testId === 'compass') {
    return 'compass'
  }

  if (props.testId === 'gps') {
    return 'gps'
  }

  return 'sensor'
})

const sensorAxisEntries = computed(() => {
  if (props.testId === 'rotation') {
    return [
      { label: 'Alpha', value: Number(guidedState.value?.metrics.alpha ?? 0) },
      { label: 'Beta', value: Number(guidedState.value?.metrics.beta ?? 0) },
      { label: 'Gamma', value: Number(guidedState.value?.metrics.gamma ?? 0) }
    ]
  }

  if (props.testId === 'accelerometer') {
    return [
      { label: 'X', value: Number(guidedState.value?.metrics.x ?? 0) },
      { label: 'Y', value: Number(guidedState.value?.metrics.y ?? 0) },
      { label: 'Z', value: Number(guidedState.value?.metrics.z ?? 0) }
    ]
  }

  if (props.testId === 'gyroscope') {
    return [
      { label: 'Alpha', value: Number(guidedState.value?.metrics.alpha ?? 0) },
      { label: 'Beta', value: Number(guidedState.value?.metrics.beta ?? 0) },
      { label: 'Gamma', value: Number(guidedState.value?.metrics.gamma ?? 0) }
    ]
  }

  return []
})

const sensorInfoEntries = computed(() => {
  if (props.testId === 'rotation') {
    const orientationsSeen = Array.isArray(guidedState.value?.metrics.orientationsSeen)
      ? (guidedState.value?.metrics.orientationsSeen as string[])
      : []
    return [
      { label: 'Permission', value: sensorPermissionState.value },
      { label: 'Orientation actuelle', value: String(guidedState.value?.metrics.orientation ?? 'unknown') },
      { label: 'Orientations vues', value: orientationsSeen.length > 0 ? orientationsSeen.join(', ') : 'aucune' },
      { label: 'Activite capteur', value: Boolean(guidedState.value?.metrics.hasGyroscopeData) ? 'oui' : 'non' }
    ]
  }

  if (props.testId === 'accelerometer') {
    return [
      { label: 'Permission', value: sensorPermissionState.value },
      { label: 'Amplitude X max', value: Number(guidedState.value?.metrics.maxAbsX ?? 0).toFixed(2) },
      { label: 'Amplitude Y max', value: Number(guidedState.value?.metrics.maxAbsY ?? 0).toFixed(2) },
      { label: 'Amplitude Z max', value: Number(guidedState.value?.metrics.maxAbsZ ?? 0).toFixed(2) },
      { label: 'Variation', value: Boolean(guidedState.value?.metrics.variationDetected) ? 'detectee' : 'faible' }
    ]
  }

  if (props.testId === 'gyroscope') {
    return [
      { label: 'Permission', value: sensorPermissionState.value },
      { label: 'Rotation alpha max', value: Number(guidedState.value?.metrics.maxAbsAlpha ?? 0).toFixed(2) },
      { label: 'Rotation beta max', value: Number(guidedState.value?.metrics.maxAbsBeta ?? 0).toFixed(2) },
      { label: 'Rotation gamma max', value: Number(guidedState.value?.metrics.maxAbsGamma ?? 0).toFixed(2) },
      { label: 'Variation', value: Boolean(guidedState.value?.metrics.variationDetected) ? 'detectee' : 'faible' }
    ]
  }

  if (props.testId === 'compass') {
    return [
      { label: 'Permission', value: sensorPermissionState.value },
      { label: 'Cap nord', value: compassHeading.value !== null ? `${Math.round(compassHeading.value)}°` : 'indisponible' },
      { label: 'Orientation cardinale', value: String(guidedState.value?.metrics.cardinal ?? 'inconnue') },
      { label: 'Cap exploitable', value: Boolean(guidedState.value?.metrics.headingDetected) ? 'oui' : 'non' }
    ]
  }

  return [
    { label: 'Permission', value: sensorPermissionState.value },
    { label: 'Latitude', value: typeof guidedState.value?.metrics.latitude === 'number' ? Number(guidedState.value.metrics.latitude).toFixed(6) : 'indisponible' },
    { label: 'Longitude', value: typeof guidedState.value?.metrics.longitude === 'number' ? Number(guidedState.value.metrics.longitude).toFixed(6) : 'indisponible' },
    { label: 'Precision', value: typeof guidedState.value?.metrics.accuracy === 'number' ? `${Number(guidedState.value.metrics.accuracy).toFixed(1)} m` : 'indisponible' },
    { label: 'Altitude', value: typeof guidedState.value?.metrics.altitude === 'number' ? `${Number(guidedState.value.metrics.altitude).toFixed(1)} m` : 'indisponible' },
    { label: 'Vitesse', value: typeof guidedState.value?.metrics.speed === 'number' ? `${Number(guidedState.value.metrics.speed).toFixed(1)} m/s` : 'indisponible' },
    { label: 'Acquisition', value: typeof guidedState.value?.metrics.acquiredInMs === 'number' ? `${Math.round(Number(guidedState.value.metrics.acquiredInMs))} ms` : 'en attente' }
  ]
})

const sensorPhoneRotation = computed(() => {
  if (props.testId === 'accelerometer') {
    return {
      x: Number(guidedState.value?.metrics.x ?? 0) * 3,
      y: Number(guidedState.value?.metrics.y ?? 0) * 3,
      z: Number(guidedState.value?.metrics.z ?? 0) * 1.5
    }
  }

  return {
    x: Number(guidedState.value?.metrics.beta ?? 0) * 0.5,
    y: Number(guidedState.value?.metrics.gamma ?? 0) * 0.5,
    z: Number(guidedState.value?.metrics.alpha ?? 0) * 0.15
  }
})

const sensorMaxValue = computed(() => {
  if (props.testId === 'rotation') {
    return 180
  }

  if (props.testId === 'accelerometer') {
    return 12
  }

  if (props.testId === 'gyroscope') {
    return 90
  }

  return 360
})

const sensorPanelTitle = computed(() => {
  if (props.testId === 'rotation') {
    return 'Rotation et orientation'
  }

  if (props.testId === 'accelerometer') {
    return 'Accelerometre live'
  }

  if (props.testId === 'gyroscope') {
    return 'Gyroscope live'
  }

  if (props.testId === 'compass') {
    return 'Boussole live'
  }

  return 'GPS'
})

const sensorPanelHint = computed(() => {
  if (props.testId === 'rotation') {
    return 'Tourne le telephone entre portrait et paysage pour confirmer les deux orientations.'
  }

  if (props.testId === 'accelerometer') {
    return 'Incline doucement le telephone pour faire varier X, Y et Z.'
  }

  if (props.testId === 'gyroscope') {
    return 'Fais pivoter le telephone pour voir varier les vitesses de rotation.'
  }

  if (props.testId === 'compass') {
    return 'Tourne doucement le telephone pour verifier que le nord reste stable et lisible.'
  }

  return 'Attends une position, puis verifie la coherence des mesures GPS.'
})

const mediaInfoEntries = computed(() => {
  if (props.testId === 'autofocus') {
    return [
      { label: 'Permission', value: String(guidedState.value?.metrics.permissionState ?? 'unknown') },
      { label: 'Camera active', value: String(guidedState.value?.metrics.activeDeviceLabel ?? 'inconnue') },
      { label: 'Etape proche', value: Boolean(guidedState.value?.metrics.nearValidated) ? 'validee' : 'non validee' },
      { label: 'Etape loin', value: Boolean(guidedState.value?.metrics.farValidated) ? 'validee' : 'non validee' }
    ]
  }

  return [
    { label: 'Permission', value: String(guidedState.value?.metrics.permissionState ?? 'unknown') },
    { label: 'Camera active', value: String(guidedState.value?.metrics.activeDeviceLabel ?? 'inconnue') },
    {
      label: 'Objectifs detectes',
      value: String(guidedState.value?.metrics.availableDeviceCount ?? selectedCameraDevices.value.length)
    },
    {
      label: 'Capture',
      value: Boolean(guidedState.value?.metrics.captureSucceeded) ? 'reussie' : 'non capturee'
    }
  ]
})

const microphoneInfoEntries = computed(() => [
  { label: 'Permission', value: String(guidedState.value?.metrics.permissionState ?? 'unknown') },
  { label: 'Flux audio', value: Boolean(guidedState.value?.metrics.streamOpened) ? 'actif' : 'inactif' },
  { label: 'Niveau actuel', value: `${Math.round(microphoneLevel.value * 100)}%` },
  { label: 'Pic detecte', value: `${Math.round(microphonePeakLevel.value * 100)}%` },
  { label: 'Son detecte', value: microphoneSoundDetected.value ? 'oui' : 'non' }
])

const helperText = computed(() => {
  if (step.value?.status === 'running' && testDefinition.value?.mode === 'automatic') {
    return 'Collecte en cours.'
  }

  if (step.value?.result) {
    return 'Test termine.'
  }

  if (isMediaTest.value) {
    return 'Autorise la camera puis valide le rendu.'
  }

  if (isMicrophoneTest.value) {
    return 'Autorise le micro puis parle.'
  }

  if (isMultitouchTest.value) {
    return 'Pose plusieurs doigts ensemble.'
  }

  if (testDefinition.value?.mode === 'guided') {
    return 'Suis l’action affichee.'
  }

  return 'Lance le controle.'
})

const badgeLabel = computed(() => {
  if (!step.value?.result) {
    return step.value?.status === 'running' ? 'en cours' : 'a lancer'
  }

  return step.value.result.status.replace('_', ' ')
})

const badgeClass = computed(() => {
  const status = step.value?.result?.status ?? (step.value?.status === 'running' ? 'pending' : 'skipped')

  if (status === 'pass') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'warning' || status === 'pending') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'failed') {
    return 'bg-rose-100 text-rose-700'
  }

  return 'bg-slate-200 text-slate-700'
})

const confirmationTitle = computed(() => {
  if (props.testId === 'screen') {
    return 'Verdict visuel final'
  }

  if (props.testId === 'touch') {
    return 'Verdict tactile final'
  }

  if (isMultitouchTest.value) {
    return 'Verdict multitouch final'
  }

  if (props.testId === 'gps') {
    return 'Verdict GPS final'
  }

  if (isCameraCaptureTest.value) {
    return 'Verdict camera final'
  }

  if (isAutofocusTest.value) {
    return 'Verdict autofocus final'
  }

  if (isMicrophoneTest.value) {
    return 'Verdict microphone final'
  }

  return 'Verdict capteur final'
})

const confirmationText = computed(() => {
  if (props.testId === 'screen') {
    return "Confirme l'etat de l'ecran."
  }

  if (props.testId === 'touch') {
    return 'Confirme le ressenti tactile.'
  }

  if (isMultitouchTest.value) {
    return 'Confirme la detection simultanee.'
  }

  if (props.testId === 'gps') {
    return 'Confirme la coherence GPS.'
  }

  if (isCameraCaptureTest.value) {
    return 'Confirme le flux et la capture.'
  }

  if (isAutofocusTest.value) {
    return "Confirme la mise au point."
  }

  if (isMicrophoneTest.value) {
    return 'Confirme la reaction du micro.'
  }

  return 'Confirme les mesures.'
})

const launchButtonLabel = computed(() => {
  if (isSensorTest.value || isMediaTest.value || isMicrophoneTest.value) {
    return 'Autoriser'
  }

  return 'Commencer'
})

const mediaPrimaryActionLabel = computed(() => {
  if (isCameraCaptureTest.value) {
    return currentCaptureUrl.value ? 'Passer a la validation' : 'Prendre une photo'
  }

  if (currentAutofocusStepId.value === 'autofocus-near') {
    return 'Etape suivante'
  }

  if (currentAutofocusStepId.value === 'autofocus-far') {
    return 'Passer a la validation'
  }

  return 'Continuer'
})

const motionStateToMetric = (state: MotionPermissionState) => state

const updateFromSensorError = (error: SensorError) => {
  if (!sensorMode.value) {
    return
  }

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: error.code !== 'unavailable',
    permissionState:
      error.code === 'permission_denied'
        ? 'denied'
        : error.code === 'unavailable'
          ? 'not_supported'
          : String(guidedState.value?.metrics.permissionState ?? 'unknown'),
    acquisitionError: error.message
  })
}

const runCurrentAutomaticTest = async () => {
  await store.runTest(props.sessionId, props.testId)
}

const enterScreenFullscreen = async () => {
  if (!screenImmersiveActive.value || !screenPanelRef.value) {
    return
  }

  const element = screenPanelRef.value as HTMLElement & {
    requestFullscreen?: () => Promise<void>
  }

  if (document.fullscreenElement || typeof element.requestFullscreen !== 'function') {
    return
  }

  try {
    await element.requestFullscreen()
  } catch {
    // Safari on iPhone may refuse the native API; immersive CSS fallback remains active.
  }
}

const exitScreenFullscreen = async () => {
  if (!document.fullscreenElement || typeof document.exitFullscreen !== 'function') {
    return
  }

  try {
    await document.exitFullscreen()
  } catch {
    // Ignore fullscreen exit failures and keep the test active.
  }
}

const syncImmersiveScreenChrome = () => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const body = document.body

  if (screenImmersiveActive.value) {
    const background = currentGuidedSubStep.value?.color || '#020617'
    root.classList.add('immersive-screen')
    body.classList.add('immersive-screen')
    root.style.setProperty('--immersive-screen-color', background)
    return
  }

  root.classList.remove('immersive-screen')
  body.classList.remove('immersive-screen')
  root.style.removeProperty('--immersive-screen-color')
}

const handleScreenProbeTouch = () => {
  const now = Date.now()

  if (now - lastScreenProbeTapAt.value < 320) {
    void exitScreenFullscreen()
  }

  lastScreenProbeTapAt.value = now
}

const stopActiveRuntimes = () => {
  sensorRuntime.stopListening()
  cameraRuntime.stopStream()
  microphoneRuntime.stopStream()
  void exitScreenFullscreen()
}

const syncCameraMetrics = (overrides?: Record<string, string | number | boolean | null>) => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: cameraRuntime.supported.value,
    permissionState: cameraRuntime.permissionState.value,
    streamOpened: cameraRuntime.streamActive.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    availableDeviceCount: selectedCameraDevices.value.length,
    ...overrides
  })
}

const launchCameraTest = async () => {
  if (isCameraCaptureTest.value) {
    clearSessionCapture(props.sessionId, props.testId)
  }

  const permission = await cameraRuntime.requestPermission()

  syncCameraMetrics({
    permissionState: permission
  })

  if (permission === 'denied' || permission === 'not_supported') {
    return
  }

  const stream = await cameraRuntime.startStream({
    facingMode: props.testId === 'camera-front' ? 'user' : 'environment'
  })

  syncCameraMetrics({
    streamOpened: Boolean(stream)
  })
}

const launchMicrophoneTest = async () => {
  const permission = await microphoneRuntime.requestPermission()

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: microphoneRuntime.supported.value,
    permissionState: permission,
    streamOpened: false,
    level: 0,
    peakLevel: 0,
    soundDetected: false
  })

  if (permission === 'denied' || permission === 'not_supported') {
    return
  }

  const stream = await microphoneRuntime.startStream()

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: microphoneRuntime.supported.value,
    permissionState: microphoneRuntime.permissionState.value,
    streamOpened: Boolean(stream),
    level: microphoneRuntime.level.value,
    peakLevel: microphoneRuntime.peakLevel.value,
    soundDetected: microphoneRuntime.soundDetected.value
  })
}

const launchGuidedTest = async () => {
  if (launchInFlight.value) {
    return
  }

  launchInFlight.value = true
  store.startGuidedTest(props.sessionId, props.testId)

  try {
    if (isMediaTest.value) {
      await launchCameraTest()
      return
    }

    if (isMicrophoneTest.value) {
      await launchMicrophoneTest()
      return
    }

    if (!isSensorTest.value || !sensorMode.value) {
      return
    }

    const permission = await sensorRuntime.requestPermission(sensorMode.value)

    store.updateGuidedMetrics(
      props.sessionId,
      props.testId,
      {
        permissionState: motionStateToMetric(permission),
        supported: sensorRuntime.supported.value,
        acquisitionError: null
      },
      { persist: true }
    )

    if (permission === 'denied' || permission === 'not_supported') {
      return
    }

    sensorRuntime.startListening(
      sensorMode.value,
      (sample) => {
      if (sensorMode.value === 'rotation') {
        const rotation = sample as RotationSample
        const previousOrientations = Array.isArray(guidedState.value?.metrics.orientationsSeen)
          ? (guidedState.value?.metrics.orientationsSeen as string[])
          : []
        const orientationsSeen = Array.from(new Set([...previousOrientations, rotation.orientation]))

        store.updateGuidedMetrics(
          props.sessionId,
          props.testId,
          {
            supported: true,
            permissionState: sensorRuntime.permissionState.value,
            orientationsSeen,
            orientation: rotation.orientation,
            alpha: rotation.alpha,
            beta: rotation.beta,
            gamma: rotation.gamma,
            hasGyroscopeData: rotation.hasGyroscopeData
          },
          { persist: false }
        )
        return
      }

      if (sensorMode.value === 'accelerometer') {
        const accelerometer = sample as AccelerometerSample
        const maxAbsX = Math.max(Math.abs(accelerometer.x), Number(guidedState.value?.metrics.maxAbsX ?? 0))
        const maxAbsY = Math.max(Math.abs(accelerometer.y), Number(guidedState.value?.metrics.maxAbsY ?? 0))
        const maxAbsZ = Math.max(Math.abs(accelerometer.z), Number(guidedState.value?.metrics.maxAbsZ ?? 0))
        const threshold = Number(guidedState.value?.metrics.threshold ?? 2)

        store.updateGuidedMetrics(
          props.sessionId,
          props.testId,
          {
            supported: true,
            permissionState: sensorRuntime.permissionState.value,
            x: accelerometer.x,
            y: accelerometer.y,
            z: accelerometer.z,
            maxAbsX,
            maxAbsY,
            maxAbsZ,
            variationDetected: maxAbsX >= threshold || maxAbsY >= threshold || maxAbsZ >= threshold
          },
          { persist: false }
        )
        return
      }

      if (sensorMode.value === 'gyroscope') {
        const gyroscope = sample as GyroscopeSample
        const maxAbsAlpha = Math.max(Math.abs(gyroscope.alpha), Number(guidedState.value?.metrics.maxAbsAlpha ?? 0))
        const maxAbsBeta = Math.max(Math.abs(gyroscope.beta), Number(guidedState.value?.metrics.maxAbsBeta ?? 0))
        const maxAbsGamma = Math.max(Math.abs(gyroscope.gamma), Number(guidedState.value?.metrics.maxAbsGamma ?? 0))
        const threshold = Number(guidedState.value?.metrics.threshold ?? 15)

        store.updateGuidedMetrics(
          props.sessionId,
          props.testId,
          {
            supported: true,
            permissionState: sensorRuntime.permissionState.value,
            alpha: gyroscope.alpha,
            beta: gyroscope.beta,
            gamma: gyroscope.gamma,
            maxAbsAlpha,
            maxAbsBeta,
            maxAbsGamma,
            variationDetected: maxAbsAlpha >= threshold || maxAbsBeta >= threshold || maxAbsGamma >= threshold
          },
          { persist: false }
        )
        return
      }

      if (sensorMode.value === 'compass') {
        const compass = sample as CompassSample
        const heading = typeof compass.heading === 'number' ? Math.round(compass.heading) : null
        const cardinal = (() => {
          if (heading === null) return 'inconnue'
          if (heading >= 315 || heading < 45) return 'nord'
          if (heading >= 45 && heading < 135) return 'est'
          if (heading >= 135 && heading < 225) return 'sud'
          return 'ouest'
        })()

        store.updateGuidedMetrics(
          props.sessionId,
          props.testId,
          {
            supported: true,
            permissionState: sensorRuntime.permissionState.value,
            heading,
            headingDetected: compass.hasHeading,
            cardinal,
            alpha: compass.alpha,
            beta: compass.beta,
            gamma: compass.gamma
          },
          { persist: false }
        )
        return
      }

      const gps = sample as GpsSample

      store.updateGuidedMetrics(
        props.sessionId,
        props.testId,
        {
          supported: true,
          permissionState: sensorRuntime.permissionState.value === 'unknown' ? 'granted' : sensorRuntime.permissionState.value,
          acquired: true,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          altitude: gps.altitude,
          speed: gps.speed,
          acquiredInMs: gps.acquiredInMs,
          acquisitionError: null
        },
        { persist: false }
      )
      },
      updateFromSensorError
    )
  } finally {
    launchInFlight.value = false
  }
}

const captureCameraFrame = () => {
  const dataUrl = cameraRuntime.captureFrame(cameraPanelRef.value?.videoElement ?? null)

  if (!dataUrl) {
    syncCameraMetrics({
      captureSucceeded: false,
      capturePreviewAvailable: false
    })
    return
  }

  setSessionCapture(props.sessionId, props.testId, dataUrl)
  syncCameraMetrics({
    captureSucceeded: true,
    capturePreviewAvailable: true
  })
}

const switchRearDevice = async (deviceId: string) => {
  if (props.testId !== 'camera-rear') {
    return
  }

  const stream = await cameraRuntime.switchDevice(deviceId)
  syncCameraMetrics({
    streamOpened: Boolean(stream)
  })
}

const validateAutofocusStep = () => {
  if (currentAutofocusStepId.value === 'autofocus-near') {
    store.updateGuidedMetrics(props.sessionId, props.testId, {
      nearValidated: true
    })
    store.completeGuidedStep(props.sessionId, props.testId)
    return
  }

  if (currentAutofocusStepId.value === 'autofocus-far') {
    store.updateGuidedMetrics(props.sessionId, props.testId, {
      farValidated: true
    })
    store.completeGuidedStep(props.sessionId, props.testId)
  }
}

const toggleScreenConcern = () => {
  const stepId = currentGuidedSubStep.value?.id

  if (props.testId !== 'screen' || !stepId) {
    return
  }

  const nextFlaggedStepIds = flaggedScreenStepIds.value.includes(stepId)
    ? flaggedScreenStepIds.value.filter((entry) => entry !== stepId)
    : [...flaggedScreenStepIds.value, stepId]

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    flaggedStepIds: nextFlaggedStepIds
  })
}

const advanceScreenStep = () => {
  if (props.testId !== 'screen') {
    return
  }

  store.completeGuidedStep(props.sessionId, props.testId)
}

const finishTouchCollection = (mode: 'auto' | 'gesture') => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    completedAutomatically: mode === 'auto',
    completedByGesture: mode === 'gesture'
  })
  store.moveGuidedTestToConfirm(props.sessionId, props.testId)
}

const trackTouchGrid = ({ cellIds }: { cellIds: string[] }) => {
  const visitedCellIds = Array.from(new Set([...touchVisitedCellIds.value, ...cellIds]))
  const totalCells = touchRows.value * touchCols.value
  const coveragePercent = Math.round((visitedCellIds.length / totalCells) * 100)

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    visitedCellIds,
    coveragePercent
  })

  if (visitedCellIds.length === totalCells && guidedState.value?.phase === 'active') {
    finishTouchCollection('auto')
  }
}

const trackTouchTap = () => {
  const now = Date.now()
  touchTapCount.value = now - lastTouchTapAt.value <= 350 ? touchTapCount.value + 1 : 1
  lastTouchTapAt.value = now

  if (touchTapCount.value >= 5 && guidedState.value?.phase === 'active') {
    finishTouchCollection('gesture')
    touchTapCount.value = 0
  }
}

const trackMultitouchPad = ({ activeTouches, maxTouches }: { activeTouches: number; maxTouches: number }) => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    activeTouches,
    maxSimultaneousTouches: maxTouches
  })
}

const finishMultitouchCollection = () => {
  store.moveGuidedTestToConfirm(props.sessionId, props.testId)
}

const finishSensorCollection = () => {
  sensorRuntime.stopListening()
  store.moveGuidedTestToConfirm(props.sessionId, props.testId)
}

const finishMicrophoneCollection = () => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    streamOpened: Boolean(microphoneRuntime.activeStream.value),
    level: microphoneRuntime.level.value,
    peakLevel: microphoneRuntime.peakLevel.value,
    soundDetected: microphoneRuntime.soundDetected.value
  })
  microphoneRuntime.stopStream()
  store.moveGuidedTestToConfirm(props.sessionId, props.testId)
}

const handleMediaPrimaryAction = () => {
  if (isCameraCaptureTest.value) {
    if (!currentCaptureUrl.value) {
      captureCameraFrame()
      return
    }

    store.moveGuidedTestToConfirm(props.sessionId, props.testId)
    return
  }

  validateAutofocusStep()
}

const confirmGuided = (verdict: DiagnosticGuidedUserVerdict) => {
  stopActiveRuntimes()

  store.setGuidedUserVerdict(props.sessionId, props.testId, verdict)
  store.finalizeGuidedTest(props.sessionId, props.testId)
}

const goNext = async () => {
  stopActiveRuntimes()

  if (!nextStep.value) {
    await router.push({
      name: 'diagnostic-summary',
      params: { sessionId: props.sessionId }
    })
    return
  }

  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: props.sessionId,
      testId: nextStep.value.testId
    }
  })
}

const quitDiagnostic = async () => {
  stopActiveRuntimes()
  await router.push({ name: 'home' })
}

onBeforeUnmount(() => {
  stopActiveRuntimes()
  syncImmersiveScreenChrome()
})

watch(
  [screenImmersiveActive, screenPanelRef],
  async ([active, panel]) => {
    if (active) {
      if (!panel) {
        await nextTick()
      }
      void enterScreenFullscreen()
      return
    }

    void exitScreenFullscreen()
  },
  { immediate: true }
)

watch(
  [screenImmersiveActive, currentGuidedSubStep],
  () => {
    syncImmersiveScreenChrome()
  },
  { immediate: true }
)

watch(
  () => [props.sessionId, props.testId, microphoneRuntime.level.value, microphoneRuntime.peakLevel.value, microphoneRuntime.soundDetected.value] as const,
  ([sessionId, testId, levelValue, peakValue, soundDetected]) => {
    if (testId !== 'microphone' || guidedState.value?.phase !== 'active') {
      return
    }

    store.updateGuidedMetrics(
      sessionId,
      testId,
      {
        level: levelValue,
        peakLevel: peakValue,
        soundDetected
      },
      { persist: false }
    )
  }
)

watch(
  () => `${props.sessionId}:${props.testId}`,
  () => {
    autoStartedTestKey.value = null
    lastScreenProbeTapAt.value = 0
    lastTouchTapAt.value = 0
    touchTapCount.value = 0
  }
)

watch(
  () => [props.sessionId, props.testId, guidedState.value?.phase, Boolean(step.value?.result)] as const,
  ([sessionId, testId, phase, hasResult]) => {
    const key = `${sessionId}:${testId}`

    if (!requiresSystemPermission.value || hasResult || phase !== 'idle' || autoStartedTestKey.value === key) {
      return
    }

    autoStartedTestKey.value = key
    void launchGuidedTest()
  },
  { immediate: true }
)
</script>
