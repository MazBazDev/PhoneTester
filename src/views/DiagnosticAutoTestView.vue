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
      eyebrow="Verification"
      :title="productTestCopy.label"
      :description="screenImmersiveActive ? '' : productTestCopy.description"
      :progress="visibleProgress"
      :immersive="screenImmersiveActive"
    >
      <template #header-actions>
        <button
          type="button"
          aria-label="Quitter le diagnostic"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-950 transition hover:bg-stone-200/70"
          @click="openQuitDialog"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" class="h-4 w-4">
            <path
              d="M5 5L15 15M15 5L5 15"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </template>

      <div class="space-y-4" :class="screenImmersiveActive ? 'flex min-h-[70vh] flex-col justify-between' : ''">
        <AppCard
          v-if="showQuitDialog"
          class="border border-rose-200 bg-rose-50/80"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">Quitter le diagnostic</p>
          <p class="mt-2 text-sm leading-6 text-rose-700">
            La verification en cours sera arretee et tu reviendras a l’accueil.
          </p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <AppButton class="w-full" variant="secondary" @click="closeQuitDialog">Continuer le diagnostic</AppButton>
            <AppButton class="w-full" @click="quitDiagnostic">Quitter</AppButton>
          </div>
        </AppCard>

        <div
          v-if="!screenImmersiveActive"
          class="rounded-[20px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3"
        >
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {{ instructionEyebrow }}
          </p>
          <p class="mt-2 text-base font-semibold text-slate-950">{{ instructionTitle }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ instructionText }}</p>
        </div>

        <section v-if="guidedState?.phase === 'idle' && props.testId === 'screen'">
          <PhonePreviewPanel mode="screen-intro" />
        </section>

        <section v-if="guidedState?.phase === 'idle' && props.testId === 'touch'">
          <PhonePreviewPanel mode="touch-intro" />
        </section>

        <AppCard v-if="step.result && !screenImmersiveActive">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Test termine</p>
          <p class="mt-2 text-base font-semibold text-slate-950">{{ productTestCopy.label }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ step.result.summary }}</p>
        </AppCard>

        <template v-if="testDefinition.mode === 'guided' && guidedState">
          <section
            v-if="props.testId === 'screen' && currentGuidedSubStep && ['active', 'confirm'].includes(guidedState.phase)"
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
              :class="
                screenImmersiveActive
                  ? 'mx-auto w-full max-w-[22rem] bg-transparent'
                  : ''
              "
            >
              <AppButton
                class="w-full"
                :class="
                  screenImmersiveActive
                    ? 'min-h-10 rounded-full border-white/20 bg-black/12 px-3 py-2 text-xs font-medium text-current backdrop-blur-sm'
                    : ''
                "
                :variant="screenImmersiveActive ? 'ghost' : 'secondary'"
                @click="toggleScreenConcern"
              >
                {{ currentScreenStepFlagged ? 'Doute marque' : 'Marquer un doute' }}
              </AppButton>
              <AppButton
                class="w-full"
                :class="
                  screenImmersiveActive
                    ? 'min-h-10 rounded-full border border-white/20 bg-black/12 px-3 py-2 text-xs font-medium text-current backdrop-blur-sm'
                    : ''
                "
                :variant="screenImmersiveActive ? 'ghost' : 'primary'"
                @click="advanceScreenStep"
              >
                {{ isLastGuidedSubStep ? 'Terminer la sequence' : 'Couleur suivante' }}
              </AppButton>
            </div>
          </section>

          <section
            v-else-if="props.testId === 'touch' && guidedState.phase === 'active'"
            class="rounded-[32px] bg-slate-50/90 p-4"
          >
            <TouchGridPanel
              :cols="touchCols"
              :rows="touchRows"
              :visited-cell-ids="touchVisitedCellIds"
              @track="trackTouchGrid"
              @tap="trackTouchTap"
            />
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

          <section v-else-if="isRotationTest && guidedState.phase === 'active'">
            <PhonePreviewPanel
              mode="rotation"
              :orientation="rotationHasLandscape ? 'landscape' : 'portrait'"
              :validated-states="rotationValidatedStates"
              :active-state="rotationActiveState"
            />
          </section>

          <section v-else-if="isAccelerometerTest && guidedState.phase === 'active'">
            <PhonePreviewPanel
              mode="tilt"
              :validated-states="accelerometerValidatedStates"
              :active-state="accelerometerActiveState"
            />
          </section>

          <section v-else-if="isGyroscopeTest && guidedState.phase === 'active'">
            <PhonePreviewPanel
              mode="gyro"
              :validated-states="gyroscopeValidatedStates"
              :active-state="gyroscopeActiveState"
            />
          </section>

          <section v-else-if="isSensorTest && guidedState.phase === 'active'">
            <SensorLivePanel
              :title="sensorPanelTitle"
              :hint="sensorPanelHint"
              :axis-entries="[]"
              :info-entries="[]"
              :phone-rotation="{ x: 0, y: 0, z: 0 }"
              :max-value="360"
              :permission-state="sensorPermissionState"
              :variant="sensorPanelVariant"
              :compass-heading="compassHeading"
              :gps-status-label="gpsStatusLabel"
              :gps-secondary-label="gpsSecondaryLabel"
            />
          </section>

          <section v-else-if="isMicrophoneTest && ['active', 'confirm'].includes(guidedState.phase)">
            <MicrophoneLivePanel
              hint="Parle ou tapote pres du micro. La courbe doit reagir rapidement."
              :level="microphoneLevel"
              :peak-level="microphonePeakLevel"
              :sound-detected="microphoneSoundDetected"
              :permission-state="String(guidedState.metrics.permissionState ?? microphoneRuntime.permissionState.value)"
              :waveform="microphoneWaveform"
            />
          </section>

          <section v-else-if="isMediaTest && ['active', 'confirm'].includes(guidedState.phase)">
            <div class="space-y-4">
              <CameraLivePanel
                ref="cameraPanelRef"
                :stream="cameraStream"
                :preview-url="currentCaptureUrl"
                :active-device-label="cameraRuntime.activeDeviceLabel.value"
                :available-devices="selectedCameraDevices"
                :selected-device-id="cameraActiveDeviceId"
                :show-device-selector="false"
                :show-target="isCameraAutofocusStage"
                :target-label="autofocusTargetLabel"
                @switch-device="switchRearDevice"
                @preview-ready-change="handleCameraPreviewReadyChange"
              />

              <div class="flex items-center justify-between rounded-[20px] border border-stone-300/80 bg-[color:var(--color-surface)] px-4 py-3 text-sm text-slate-600">
                <span v-if="isCameraRearStage">
                  {{ rearRemainingObjectiveCount === 0 ? 'Tous les objectifs arriere sont verifies.' : `Objectif ${rearCurrentObjectiveIndex} sur ${rearAvailableDeviceIds.length || selectedCameraDevices.length}` }}
                </span>
                <span v-else-if="isCameraAutofocusNearStage">
                  Verifie la mise au point sur un objet proche.
                </span>
                <span v-else-if="isCameraAutofocusFarStage">
                  Verifie la mise au point sur un sujet plus eloigne.
                </span>
                <span v-else>
                  Prends une photo avec la camera avant.
                </span>
                <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <template v-if="isCameraRearStage">
                    {{ rearCompletedObjectiveCount }}/{{ rearAvailableDeviceIds.length || selectedCameraDevices.length }}
                  </template>
                  <template v-else-if="isCameraFrontStage">
                    {{ frontCaptureSucceeded ? 'pret' : 'a faire' }}
                  </template>
                  <template v-else>
                    {{ currentGuidedSubStep?.label }}
                  </template>
                </span>
              </div>
            </div>
          </section>
        </template>
      </div>

      <template #actions>
        <template v-if="step.result">
          <AppButton v-if="previousStep" class="flex-1" variant="secondary" @click="goPrevious">
            Precedent
          </AppButton>
          <AppButton class="flex-1" variant="secondary" @click="restartCurrentTest">
            Relancer
          </AppButton>
          <AppButton class="flex-1" @click="goNext">
            {{ nextStep ? 'Suivant' : 'Verdict final' }}
          </AppButton>
        </template>

        <template v-if="testDefinition.mode === 'automatic' && !step.result">
          <AppButton class="flex-1" @click="runCurrentAutomaticTest">
            Executer
          </AppButton>
        </template>

        <template v-else-if="isMicrophoneTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" variant="secondary" @click="toggleSubjectiveIssue">
            {{ subjectiveIssueReported ? 'Probleme signale' : 'Signaler un probleme' }}
          </AppButton>
          <AppButton class="flex-1" @click="finishMicrophoneCollection">
            Continuer
          </AppButton>
        </template>

        <template v-else-if="isMediaTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" variant="secondary" @click="toggleSubjectiveIssue">
            {{ subjectiveIssueReported ? 'Probleme signale' : 'Signaler un probleme' }}
          </AppButton>
          <AppButton class="flex-1" :disabled="mediaPrimaryActionDisabled" @click="handleMediaPrimaryAction">
            {{ mediaPrimaryActionLabel }}
          </AppButton>
        </template>

        <template v-else-if="isGyroscopeTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" @click="finishSensorCollection('warning')">
            Continuer
          </AppButton>
        </template>

        <template v-else-if="isAccelerometerTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" @click="finishSensorCollection('warning')">
            Continuer
          </AppButton>
        </template>

        <template v-else-if="isMultitouchTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" @click="finishMultitouchCollection('warning')">
            Continuer
          </AppButton>
        </template>

        <template v-else-if="isSensorTest && guidedState?.phase === 'active'">
          <AppButton class="flex-1" @click="finishSensorCollection('warning')">
            Continuer
          </AppButton>
        </template>

        <template v-else-if="testDefinition.mode === 'guided' && guidedState?.phase === 'idle'">
          <AppButton class="flex-1" @click="launchGuidedTest">
            {{ launchButtonLabel }}
          </AppButton>
        </template>
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
import PhonePreviewPanel from '../components/PhonePreviewPanel.vue'
import SensorLivePanel from '../components/SensorLivePanel.vue'
import TouchGridPanel from '../components/TouchGridPanel.vue'
import { useCameraMedia, type CameraDeviceInfo } from '../composables/useCameraMedia'
import { useMicrophoneLevel } from '../composables/useMicrophoneLevel'
import {
  useMotionSensors,
  type MotionPermissionState,
  type SensorMode,
  type AccelerometerSample,
  type GyroscopeSample,
  type CompassSample,
  type GpsSample,
  type SensorError
} from '../composables/useMotionSensors'
import type { DiagnosticGuidedUserVerdict } from '../domain/diagnostic'
import {
  getProductTestCopy,
  getVisibleProgressModel,
  getVisibleSubStepMeta,
  getVisibleTestId,
} from '../lib/productPresentation'
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
const autoAdvanceInFlight = ref(false)
const showQuitDialog = ref(false)
const rotationTrackingKey = ref<string | null>(null)
const rotationUiCleanups: Array<() => void> = []
const defaultThemeColor = '#0f172a'

const session = computed(() => store.getSessionById(props.sessionId))
const testDefinition = computed(() => store.getTestDefinition(props.testId))
const step = computed(() => store.getStepByTestId(props.sessionId, props.testId))
const nextStep = computed(() => store.getNextStep(props.sessionId, props.testId))
const previousStep = computed(() => store.getPreviousStep(props.sessionId, props.testId))
const currentVisibleTestId = computed(() => getVisibleTestId(props.testId))
const visibleSubStepMeta = computed(() => getVisibleSubStepMeta(props.testId))
const visibleProgress = computed(() => getVisibleProgressModel(session.value?.steps ?? [], props.testId))
const guidedState = computed(() => step.value?.guidedState ?? null)
const productTestCopy = computed(() =>
  getProductTestCopy(
    visibleSubStepMeta.value ? currentVisibleTestId.value : props.testId,
    testDefinition.value?.name ?? props.testId
  )
)
const currentGuidedSubStep = computed(() => store.getCurrentGuidedSubStep(props.sessionId, props.testId))
const isRotationTest = computed(() => props.testId === 'rotation')
const isAccelerometerTest = computed(() => props.testId === 'accelerometer')
const isGyroscopeTest = computed(() => props.testId === 'gyroscope')
const isSensorTest = computed(() => ['compass', 'gps'].includes(props.testId))
const isCameraTest = computed(() => props.testId === 'camera')
const isMicrophoneTest = computed(() => props.testId === 'microphone')
const isMultitouchTest = computed(() => props.testId === 'multitouch')
const isMediaTest = computed(() => isCameraTest.value)
const isImmersiveGuidedTest = computed(
  () => Boolean(testDefinition.value?.mode === 'guided' && testDefinition.value?.immersive)
)
const supportsIssueReporting = computed(() => ['microphone', 'camera'].includes(props.testId))
const subjectiveIssueReported = computed(() => guidedState.value?.userVerdict === 'warning')
const stepCompleted = computed(() => Boolean(step.value?.result))
const sensorMode = computed<SensorMode | null>(() => {
  if (['accelerometer', 'gyroscope', 'compass', 'gps'].includes(props.testId)) {
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
const currentCameraStepId = computed(() => currentGuidedSubStep.value?.id ?? null)
const isCameraRearStage = computed(() => currentCameraStepId.value === 'rear-capture')
const isCameraAutofocusNearStage = computed(() => currentCameraStepId.value === 'autofocus-near')
const isCameraAutofocusFarStage = computed(() => currentCameraStepId.value === 'autofocus-far')
const isCameraAutofocusStage = computed(
  () => isCameraAutofocusNearStage.value || isCameraAutofocusFarStage.value
)
const isCameraFrontStage = computed(() => currentCameraStepId.value === 'front-capture')
const selectedCameraDevices = computed<CameraDeviceInfo[]>(() => {
  if (isCameraFrontStage.value) {
    return frontVideoDevices.value
  }

  return rearVideoDevices.value
})
const getMetricStringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
const cameraPreviewReady = computed(() => Boolean(guidedState.value?.metrics.previewReady))
const rearAvailableDeviceIds = computed(() => getMetricStringList(guidedState.value?.metrics.rearAvailableDeviceIds))
const rearCapturedDeviceIds = computed(() => getMetricStringList(guidedState.value?.metrics.rearCapturedDeviceIds))
const rearCurrentDeviceId = computed(() => {
  const value = guidedState.value?.metrics.rearCurrentDeviceId
  return typeof value === 'string' ? value : null
})
const frontCaptureSucceeded = computed(() => Boolean(guidedState.value?.metrics.frontCaptureSucceeded))
const currentCaptureSlot = computed(() => {
  if (!isCameraTest.value) {
    return undefined
  }

  if (isCameraRearStage.value) {
    return rearCurrentDeviceId.value ? `rear:${rearCurrentDeviceId.value}` : undefined
  }

  if (isCameraFrontStage.value) {
    return 'front'
  }

  return undefined
})
const currentCaptureUrl = computed(() =>
  getSessionCapture(props.sessionId, props.testId, currentCaptureSlot.value)
)
const currentRearObjectiveCaptured = computed(() =>
  Boolean(rearCurrentDeviceId.value && rearCapturedDeviceIds.value.includes(rearCurrentDeviceId.value))
)
const rearAllObjectivesCaptured = computed(() => {
  if (!isCameraTest.value) {
    return false
  }

  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  return availableIds.length > 0 && availableIds.every((deviceId) => rearCapturedDeviceIds.value.includes(deviceId))
})
const rearRemainingObjectiveCount = computed(() => {
  if (!isCameraTest.value) {
    return 0
  }

  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  return availableIds.filter((deviceId) => !rearCapturedDeviceIds.value.includes(deviceId)).length
})
const rearCompletedObjectiveCount = computed(() => {
  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  return availableIds.filter((deviceId) => rearCapturedDeviceIds.value.includes(deviceId)).length
})
const rearCurrentObjectiveIndex = computed(() => {
  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  if (!rearCurrentDeviceId.value) {
    return availableIds.length > 0 ? 1 : 0
  }

  const index = availableIds.indexOf(rearCurrentDeviceId.value)
  return index === -1 ? 1 : index + 1
})
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
const autofocusTargetLabel = computed(() => {
  if (isCameraAutofocusNearStage.value) {
    return 'Cible proche'
  }

  if (isCameraAutofocusFarStage.value) {
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
const multitouchActiveTouches = computed(() => Number(guidedState.value?.metrics.activeTouches ?? 0))
const multitouchMaxSimultaneousTouches = computed(() => Number(guidedState.value?.metrics.maxSimultaneousTouches ?? 0))
const rotationObservedOrientations = computed(() => {
  const value = guidedState.value?.metrics.observedOrientations
  return Array.isArray(value) ? value : []
})
const rotationHasPortrait = computed(() => rotationObservedOrientations.value.includes('portrait'))
const rotationHasLandscape = computed(() => rotationObservedOrientations.value.includes('landscape'))
const rotationValidatedStates = computed(() =>
  rotationObservedOrientations.value.filter((value): value is 'portrait' | 'landscape' =>
    value === 'portrait' || value === 'landscape'
  )
)
const rotationActiveState = computed<'portrait' | 'landscape'>(() =>
  rotationHasLandscape.value ? 'landscape' : 'portrait'
)
const accelerometerCurrentTilt = computed(() => String(guidedState.value?.metrics.currentTilt ?? 'none'))
const accelerometerObservedTilts = computed(() => {
  const value = guidedState.value?.metrics.observedTilts
  return Array.isArray(value) ? value : []
})
const accelerometerValidatedStates = computed(() =>
  accelerometerObservedTilts.value.filter((value): value is 'up' | 'down' | 'left' | 'right' =>
    value === 'up' || value === 'down' || value === 'left' || value === 'right'
  )
)
const accelerometerActiveState = computed<'up' | 'down' | 'left' | 'right' | null>(() => {
  if (accelerometerCurrentTilt.value === 'up' || accelerometerCurrentTilt.value === 'down' || accelerometerCurrentTilt.value === 'left' || accelerometerCurrentTilt.value === 'right') {
    return accelerometerCurrentTilt.value
  }

  return null
})
const gyroscopeCurrentAxis = computed(() => String(guidedState.value?.metrics.currentAxis ?? 'none'))
const gyroscopeObservedAxes = computed(() => {
  const value = guidedState.value?.metrics.observedAxes
  return Array.isArray(value) ? value : []
})
const gyroscopeValidatedStates = computed(() =>
  gyroscopeObservedAxes.value.filter((value): value is 'alpha' | 'beta' | 'gamma' =>
    value === 'alpha' || value === 'beta' || value === 'gamma'
  )
)
const gyroscopeActiveState = computed<'alpha' | 'beta' | 'gamma' | null>(() => {
  if (gyroscopeCurrentAxis.value === 'alpha' || gyroscopeCurrentAxis.value === 'beta' || gyroscopeCurrentAxis.value === 'gamma') {
    return gyroscopeCurrentAxis.value
  }

  return null
})
const microphoneLevel = computed(() => Number(guidedState.value?.metrics.level ?? microphoneRuntime.level.value))
const microphonePeakLevel = computed(() => Number(guidedState.value?.metrics.peakLevel ?? microphoneRuntime.peakLevel.value))
const microphoneSoundDetected = computed(() => Boolean(guidedState.value?.metrics.soundDetected))
const microphoneWaveform = computed(() => microphoneRuntime.waveform.value)

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

const sensorPanelTitle = computed(() => {
  if (props.testId === 'compass') {
    return 'Boussole live'
  }

  return 'GPS'
})

const sensorPanelHint = computed(() => {
  if (props.testId === 'compass') {
    return 'Tourne doucement le telephone pour verifier que le nord reste stable et lisible.'
  }

  return 'Attends une position, puis verifie la coherence des mesures GPS.'
})

const instructionEyebrow = computed(() => {
  return ''
})

const instructionTitle = computed(() => {
  if (props.testId === 'device-info') {
    return 'Preparation rapide'
  }

  if (guidedState.value?.phase === 'idle' && props.testId === 'screen') {
    return 'Verifier les couleurs en plein ecran'
  }

  if (guidedState.value?.phase === 'idle' && props.testId === 'touch') {
    return 'Verifier toute la surface tactile'
  }

  return currentGuidedSubStep.value?.label ?? productTestCopy.value.label
})

const instructionText = computed(() => {
  if (props.testId === 'device-info') {
    return 'Le telephone est prepare avant de lancer les verifications.'
  }

  if (props.testId === 'touch') {
    if (guidedState.value?.phase === 'idle') {
      return 'Le test passera en plein ecran. Fais glisser ton doigt partout sur la grille puis termine si toute la surface reagit.'
    }

    return 'Passe sur toute la grille. En secours, 5 taps rapides terminent le test.'
  }

  if (props.testId === 'screen' && guidedState.value?.phase === 'idle') {
    return 'Le telephone affichera plusieurs couleurs en plein ecran. Observe chaque fond et signale un doute si tu vois un defaut.'
  }

  if (props.testId === 'multitouch') {
    return 'Pose 2 puis 3 doigts ensemble pour verifier la detection simultanee.'
  }

  if (props.testId === 'rotation') {
    return 'Tourne le telephone pour faire apparaitre portrait et paysage.'
  }

  if (props.testId === 'accelerometer') {
    return 'Incline le telephone a gauche, a droite, vers le haut et vers le bas.'
  }

  if (props.testId === 'gyroscope') {
    return 'Fais pivoter le telephone dans plusieurs sens pour reveiller les trois axes.'
  }

  if (props.testId === 'compass') {
    return 'Tourne doucement le telephone et verifie que la direction suit bien.'
  }

  if (props.testId === 'gps') {
    return 'Attends la position et verifie qu’elle semble coherente.'
  }

  if (props.testId === 'microphone') {
    return 'Parle, souffle ou tapote pres du micro pour faire reagir le signal.'
  }

  if (props.testId === 'camera') {
    return 'Verifie les objectifs arriere, la mise au point puis la camera avant.'
  }

  return currentGuidedSubStep.value?.instruction ?? 'Suis simplement la consigne a l’ecran.'
})

const launchButtonLabel = computed(() => {
  if (isImmersiveGuidedTest.value) {
    return 'Lancer le test'
  }

  if (isAccelerometerTest.value || isGyroscopeTest.value || isSensorTest.value || isMediaTest.value || isMicrophoneTest.value) {
    return 'Autoriser'
  }

  return 'Commencer'
})

const mediaPrimaryActionLabel = computed(() => {
  if (isCameraTest.value) {
    if (!cameraPreviewReady.value) {
      return 'Initialisation...'
    }

    if (isCameraRearStage.value) {
      if (!currentCaptureUrl.value) {
        return 'Prendre une photo'
      }

      return rearAllObjectivesCaptured.value ? 'Continuer' : 'Objectif suivant'
    }

    if (isCameraAutofocusNearStage.value) {
      return 'Etape suivante'
    }

    if (isCameraAutofocusFarStage.value) {
      return 'Continuer'
    }

    return currentCaptureUrl.value ? 'Terminer le test' : 'Prendre une photo'
  }

  return 'Continuer'
})

const mediaPrimaryActionDisabled = computed(() => {
  if (!isCameraTest.value) {
    return false
  }

  if ((isCameraRearStage.value || isCameraFrontStage.value) && !cameraPreviewReady.value) {
    return true
  }

  return false
})

const motionStateToMetric = (state: MotionPermissionState) => state

const getAccelerometerTilt = (sample: AccelerometerSample, threshold: number) => {
  const absX = Math.abs(sample.x)
  const absY = Math.abs(sample.y)

  if (absX < threshold && absY < threshold) {
    return 'none'
  }

  if (absX >= absY) {
    return sample.x >= 0 ? 'right' : 'left'
  }

  return sample.y >= 0 ? 'down' : 'up'
}

const getGyroscopeAxis = (sample: GyroscopeSample, threshold: number) => {
  const alpha = Math.abs(sample.alpha)
  const beta = Math.abs(sample.beta)
  const gamma = Math.abs(sample.gamma)
  const maxValue = Math.max(alpha, beta, gamma)

  if (maxValue < threshold) {
    return 'none'
  }

  if (maxValue === alpha) {
    return 'alpha'
  }

  if (maxValue === beta) {
    return 'beta'
  }

  return 'gamma'
}

const getUiOrientationKind = () => {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  const type = window.screen.orientation?.type

  if (type?.startsWith('portrait')) {
    return 'portrait'
  }

  if (type?.startsWith('landscape')) {
    return 'landscape'
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

const stopRotationUiTracking = () => {
  while (rotationUiCleanups.length > 0) {
    rotationUiCleanups.pop()?.()
  }

  rotationTrackingKey.value = null
}

const trackRotationUiSample = () => {
  if (!isRotationTest.value || guidedState.value?.phase !== 'active') {
    return
  }

  const currentOrientation = getUiOrientationKind()
  const observedOrientations = Array.from(
    new Set([...rotationObservedOrientations.value, currentOrientation].filter((value) => value !== 'unknown'))
  )

  store.updateGuidedMetrics(
    props.sessionId,
    props.testId,
    {
      supported: currentOrientation !== 'unknown',
      currentOrientation,
      observedOrientations,
      lastOrientationChangeAt: new Date().toISOString()
    },
    { persist: false }
  )

  if (
    observedOrientations.includes('portrait') &&
    observedOrientations.includes('landscape') &&
    guidedState.value?.phase === 'active'
  ) {
    stopRotationUiTracking()
    void finalizeCurrentTest('pass')
  }
}

const startRotationUiTracking = () => {
  if (!isRotationTest.value || guidedState.value?.phase !== 'active') {
    return
  }

  const key = `${props.sessionId}:${props.testId}:${guidedState.value.phase}`

  if (rotationTrackingKey.value === key) {
    return
  }

  stopRotationUiTracking()
  rotationTrackingKey.value = key
  trackRotationUiSample()

  const handleOrientationChange = () => {
    trackRotationUiSample()
  }

  window.addEventListener('orientationchange', handleOrientationChange)
  rotationUiCleanups.push(() => window.removeEventListener('orientationchange', handleOrientationChange))
  window.addEventListener('resize', handleOrientationChange)
  rotationUiCleanups.push(() => window.removeEventListener('resize', handleOrientationChange))

  if (window.screen.orientation) {
    window.screen.orientation.addEventListener('change', handleOrientationChange)
    rotationUiCleanups.push(() => window.screen.orientation.removeEventListener('change', handleOrientationChange))
  }
}

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
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')

  if (screenImmersiveActive.value) {
    const background = currentGuidedSubStep.value?.color || '#020617'
    root.classList.add('immersive-screen')
    body.classList.add('immersive-screen')
    root.style.setProperty('--immersive-screen-color', background)
    themeColorMeta?.setAttribute('content', background)
    return
  }

  root.classList.remove('immersive-screen')
  body.classList.remove('immersive-screen')
  root.style.removeProperty('--immersive-screen-color')
  themeColorMeta?.setAttribute('content', defaultThemeColor)
}

const handleScreenProbeTouch = () => {
  const now = Date.now()

  if (now - lastScreenProbeTapAt.value < 320) {
    void exitScreenFullscreen()
  }

  lastScreenProbeTapAt.value = now
}

const stopActiveRuntimes = () => {
  stopRotationUiTracking()
  sensorRuntime.stopListening()
  cameraRuntime.stopStream()
  microphoneRuntime.stopStream()
  void exitScreenFullscreen()
}

const openQuitDialog = () => {
  showQuitDialog.value = true
}

const closeQuitDialog = () => {
  showQuitDialog.value = false
}

const navigateNext = async () => {
  if (autoAdvanceInFlight.value) {
    return
  }

  autoAdvanceInFlight.value = true

  try {
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
  } finally {
    autoAdvanceInFlight.value = false
  }
}

const finalizeCurrentTest = async (verdict?: DiagnosticGuidedUserVerdict | null) => {
  stopActiveRuntimes()

  if (verdict !== undefined) {
    store.setGuidedUserVerdict(props.sessionId, props.testId, verdict)
  }

  store.finalizeGuidedTest(props.sessionId, props.testId)
}

const syncCameraMetrics = (overrides?: Record<string, string | number | boolean | null | string[]>) => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: cameraRuntime.supported.value,
    permissionState: cameraRuntime.permissionState.value,
    streamOpened: cameraRuntime.streamActive.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    activeDeviceId: cameraRuntime.activeDeviceId.value,
    ...overrides
  })
}

const getNextRearObjectiveId = () => {
  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : rearVideoDevices.value.map((device) => device.deviceId)

  return availableIds.find((deviceId) => !rearCapturedDeviceIds.value.includes(deviceId)) ?? availableIds[0] ?? null
}

const ensureCameraStageStream = async () => {
  if (!isCameraTest.value || guidedState.value?.phase !== 'active') {
    return
  }

  const desiredDeviceId = (() => {
    if (isCameraFrontStage.value) {
      return frontVideoDevices.value[0]?.deviceId ?? null
    }

    return rearCurrentDeviceId.value ?? getNextRearObjectiveId()
  })()

  let stream = cameraRuntime.activeStream.value

  if (desiredDeviceId) {
    if (cameraRuntime.activeDeviceId.value !== desiredDeviceId || !stream) {
      stream = await cameraRuntime.switchDevice(desiredDeviceId)
    }
  } else if (!stream) {
    stream = await cameraRuntime.startStream({
      facingMode: isCameraFrontStage.value ? 'user' : 'environment'
    })
  }

  syncCameraMetrics({
    streamOpened: Boolean(stream),
    activeDeviceId: cameraRuntime.activeDeviceId.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    previewReady: false,
    rearAvailableDeviceIds: rearVideoDevices.value.map((device) => device.deviceId),
    rearCurrentDeviceId:
      isCameraRearStage.value || isCameraAutofocusStage.value
        ? cameraRuntime.activeDeviceId.value
        : rearCurrentDeviceId.value
  })
}

const launchCameraTest = async () => {
  clearSessionCapture(props.sessionId, props.testId)

  const permission = await cameraRuntime.requestPermission()

  syncCameraMetrics({
    permissionState: permission,
    previewReady: false,
    activeDeviceId: null,
    rearAvailableDeviceIds: rearVideoDevices.value.map((device) => device.deviceId),
    rearCapturedDeviceIds: [],
    rearCurrentDeviceId: rearVideoDevices.value[0]?.deviceId ?? null,
    nearValidated: false,
    farValidated: false,
    frontCaptureSucceeded: false
  })

  if (permission === 'denied' || permission === 'not_supported') {
    return
  }

  await ensureCameraStageStream()
}

const launchMicrophoneTest = async () => {
  const stream = await microphoneRuntime.startStream()
  const permission = microphoneRuntime.permissionState.value

  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: microphoneRuntime.supported.value,
    permissionState: permission,
    streamOpened: Boolean(stream),
    level: microphoneRuntime.level.value,
    peakLevel: microphoneRuntime.peakLevel.value,
    soundDetected: microphoneRuntime.soundDetected.value
  })
}

const retryMicrophoneTest = async () => {
  if (!isMicrophoneTest.value || guidedState.value?.phase !== 'active') {
    return
  }

  await launchMicrophoneTest()
}

const launchGuidedTest = async () => {
  if (launchInFlight.value) {
    return
  }

  launchInFlight.value = true
  store.startGuidedTest(props.sessionId, props.testId)

  try {
    if (isRotationTest.value) {
      store.updateGuidedMetrics(
        props.sessionId,
        props.testId,
        {
          supported: true,
          currentOrientation: getUiOrientationKind(),
          observedOrientations: []
        },
        { persist: true }
      )
      startRotationUiTracking()
      return
    }

    if (isAccelerometerTest.value) {
      const permission = await sensorRuntime.requestPermission('accelerometer')

      store.updateGuidedMetrics(
        props.sessionId,
        props.testId,
        {
          permissionState: motionStateToMetric(permission),
          supported: sensorRuntime.supported.value,
          currentTilt: 'none',
          observedTilts: []
        },
        { persist: true }
      )

      if (permission === 'denied' || permission === 'not_supported') {
        return
      }

      sensorRuntime.startListening(
        'accelerometer',
        (sample) => {
          const accelerometer = sample as AccelerometerSample
          const threshold = Number(guidedState.value?.metrics.threshold ?? 2)
          const currentTilt = getAccelerometerTilt(accelerometer, threshold)
          const observedTilts = Array.from(
            new Set([...accelerometerObservedTilts.value, currentTilt].filter((value) => value !== 'none'))
          )

          store.updateGuidedMetrics(
            props.sessionId,
            props.testId,
            {
              supported: true,
              permissionState: sensorRuntime.permissionState.value,
              x: accelerometer.x,
              y: accelerometer.y,
              z: accelerometer.z,
              currentTilt,
              observedTilts
            },
            { persist: false }
          )

          if (
            ['left', 'right', 'up', 'down'].every((direction) => observedTilts.includes(direction)) &&
            guidedState.value?.phase === 'active'
          ) {
            sensorRuntime.stopListening()
            void finalizeCurrentTest('pass')
          }
        },
        updateFromSensorError
      )
      return
    }

    if (isGyroscopeTest.value) {
      const permission = await sensorRuntime.requestPermission('gyroscope')

      store.updateGuidedMetrics(
        props.sessionId,
        props.testId,
        {
          permissionState: motionStateToMetric(permission),
          supported: sensorRuntime.supported.value,
          currentAxis: 'none',
          observedAxes: []
        },
        { persist: true }
      )

      if (permission === 'denied' || permission === 'not_supported') {
        return
      }

      sensorRuntime.startListening(
        'gyroscope',
        (sample) => {
          const gyroscope = sample as GyroscopeSample
          const threshold = Number(guidedState.value?.metrics.threshold ?? 15)
          const currentAxis = getGyroscopeAxis(gyroscope, threshold)
          const observedAxes = Array.from(
            new Set([...gyroscopeObservedAxes.value, currentAxis].filter((value) => value !== 'none'))
          )

          store.updateGuidedMetrics(
            props.sessionId,
            props.testId,
            {
              supported: true,
              permissionState: sensorRuntime.permissionState.value,
              alpha: gyroscope.alpha,
              beta: gyroscope.beta,
              gamma: gyroscope.gamma,
              currentAxis,
              observedAxes
            },
            { persist: false }
          )

          if (
            ['alpha', 'beta', 'gamma'].every((axis) => observedAxes.includes(axis)) &&
            guidedState.value?.phase === 'active'
          ) {
            sensorRuntime.stopListening()
            void finalizeCurrentTest('pass')
          }
        },
        updateFromSensorError
      )
      return
    }

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

        if (compass.hasHeading && guidedState.value?.phase === 'active') {
          sensorRuntime.stopListening()
          void finalizeCurrentTest('pass')
        }
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

      if (guidedState.value?.phase === 'active') {
        sensorRuntime.stopListening()
        void finalizeCurrentTest('pass')
      }
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
    return
  }

  if (!isCameraTest.value) {
    return
  }

  if (isCameraRearStage.value) {
    const activeDeviceId = rearCurrentDeviceId.value ?? cameraActiveDeviceId.value

    if (!activeDeviceId) {
      return
    }

    setSessionCapture(props.sessionId, props.testId, dataUrl, `rear:${activeDeviceId}`)
    syncCameraMetrics({
      rearCapturedDeviceIds: Array.from(new Set([...rearCapturedDeviceIds.value, activeDeviceId]))
    })
    return
  }

  if (isCameraFrontStage.value) {
    setSessionCapture(props.sessionId, props.testId, dataUrl, 'front')
    syncCameraMetrics({
      frontCaptureSucceeded: true
    })
  }
}

const switchRearDevice = async (deviceId: string) => {
  const stream = await cameraRuntime.switchDevice(deviceId)
  syncCameraMetrics({
    streamOpened: Boolean(stream),
    activeDeviceId: cameraRuntime.activeDeviceId.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    previewReady: false,
    rearCurrentDeviceId: deviceId
  })
}

const handleCameraPreviewReadyChange = (ready: boolean) => {
  if (!isMediaTest.value || guidedState.value?.phase !== 'active') {
    return
  }

  syncCameraMetrics({
    previewReady: ready
  })
}

const validateAutofocusStep = async () => {
  if (isCameraAutofocusNearStage.value) {
    store.updateGuidedMetrics(props.sessionId, props.testId, {
      nearValidated: true
    })
    store.completeGuidedStep(props.sessionId, props.testId)
    return
  }

  if (isCameraAutofocusFarStage.value) {
    store.updateGuidedMetrics(props.sessionId, props.testId, {
      farValidated: true
    })
    store.completeGuidedStep(props.sessionId, props.testId)
    await ensureCameraStageStream()
  }
}

const toggleSubjectiveIssue = () => {
  if (!supportsIssueReporting.value) {
    return
  }

  store.setGuidedUserVerdict(
    props.sessionId,
    props.testId,
    subjectiveIssueReported.value ? null : 'warning'
  )
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

  if (isLastGuidedSubStep.value) {
    void finalizeCurrentTest()
    return
  }

  store.completeGuidedStep(props.sessionId, props.testId)
}

const finishTouchCollection = (mode: 'auto' | 'gesture') => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    completedAutomatically: mode === 'auto',
    completedByGesture: mode === 'gesture'
  })
  void finalizeCurrentTest(mode === 'auto' ? 'pass' : 'warning')
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

  if (maxTouches >= 3 && guidedState.value?.phase === 'active') {
    void finalizeCurrentTest('pass')
  }
}

const finishMultitouchCollection = (verdict: DiagnosticGuidedUserVerdict) => {
  void finalizeCurrentTest(verdict)
}

const finishSensorCollection = (verdict: DiagnosticGuidedUserVerdict) => {
  void finalizeCurrentTest(verdict)
}

const finishMicrophoneCollection = () => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    streamOpened: Boolean(microphoneRuntime.activeStream.value),
    level: microphoneRuntime.level.value,
    peakLevel: microphoneRuntime.peakLevel.value,
    soundDetected: microphoneRuntime.soundDetected.value
  })
  void finalizeCurrentTest()
}

const handleMediaPrimaryAction = async () => {
  if (!isCameraTest.value) {
    return
  }

  if (isCameraRearStage.value) {
    if (!cameraPreviewReady.value) {
      return
    }

    if (!currentCaptureUrl.value) {
      captureCameraFrame()
      return
    }

    if (!rearAllObjectivesCaptured.value) {
      const nextDeviceId = getNextRearObjectiveId()

      if (nextDeviceId) {
        await switchRearDevice(nextDeviceId)
      }

      return
    }

    store.completeGuidedStep(props.sessionId, props.testId)
    return
  }

  if (isCameraAutofocusStage.value) {
    await validateAutofocusStep()
    return
  }

  if (isCameraFrontStage.value) {
    if (!cameraPreviewReady.value) {
      return
    }

    if (!currentCaptureUrl.value) {
      captureCameraFrame()
      return
    }

    await finalizeCurrentTest()
  }
}

const goNext = async () => {
  stopActiveRuntimes()
  await navigateNext()
}

const goPrevious = async () => {
  if (!previousStep.value) {
    return
  }

  stopActiveRuntimes()
  await router.push({
    name: 'diagnostic-auto-test',
    params: {
      sessionId: props.sessionId,
      testId: previousStep.value.testId
    }
  })
}

const restartCurrentTest = async () => {
  stopActiveRuntimes()
  clearSessionCapture(props.sessionId, props.testId)
  store.resetStep(props.sessionId, props.testId)
  await nextTick()

  if (testDefinition.value?.mode === 'automatic') {
    await runCurrentAutomaticTest()
    return
  }

  if (testDefinition.value?.mode === 'guided') {
    await launchGuidedTest()
  }
}

const quitDiagnostic = async () => {
  closeQuitDialog()
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
  () => [props.sessionId, props.testId, guidedState.value?.phase] as const,
  ([, testId, phase]) => {
    if (testId === 'rotation' && phase === 'active') {
      startRotationUiTracking()
      return
    }

    stopRotationUiTracking()
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
  () => [props.sessionId, props.testId, currentCameraStepId.value, guidedState.value?.phase] as const,
  ([, testId, stepId, phase]) => {
    if (testId !== 'camera' || phase !== 'active' || !stepId) {
      return
    }

    void ensureCameraStageStream()
  },
  { immediate: true }
)

watch(
  () => `${props.sessionId}:${props.testId}`,
  () => {
    stopRotationUiTracking()
    autoStartedTestKey.value = null
    showQuitDialog.value = false
    lastScreenProbeTapAt.value = 0
    lastTouchTapAt.value = 0
    touchTapCount.value = 0
  }
)

watch(
  () => [props.sessionId, props.testId, guidedState.value?.phase, Boolean(step.value?.result)] as const,
  ([sessionId, testId, phase, hasResult]) => {
  const key = `${sessionId}:${testId}`

    if (testDefinition.value?.mode === 'automatic' && !hasResult && autoStartedTestKey.value !== key) {
      autoStartedTestKey.value = key
      void runCurrentAutomaticTest()
      return
    }

    if (testDefinition.value?.mode !== 'guided' || hasResult || phase !== 'idle' || autoStartedTestKey.value === key) {
      return
    }

    if (isImmersiveGuidedTest.value) {
      return
    }

    autoStartedTestKey.value = key
    void launchGuidedTest()
  },
  { immediate: true }
)
</script>
