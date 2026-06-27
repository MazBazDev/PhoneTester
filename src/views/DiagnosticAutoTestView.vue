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
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                En cours
              </p>
              <p class="mt-1 truncate text-sm text-slate-700">{{ helperText }}</p>
              <p v-if="visibleSubStepLabel" class="mt-2 text-xs text-slate-500">
                {{ visibleSubStepLabel }}
              </p>
            </div>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" :class="badgeClass">
              {{ badgeLabel }}
            </span>
          </div>
        </div>

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

          <section v-else-if="isRotationTest && guidedState.phase === 'active'" class="space-y-4">
            <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rotation UI</p>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">Fais basculer l’interface</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Tourne le telephone librement. Le test avance seul des qu’une vue portrait et une vue paysage ont ete observees.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Progression</p>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <div class="rounded-[20px] border px-4 py-4" :class="rotationHasPortrait ? 'border-emerald-200 bg-emerald-50' : 'border-stone-300/80 bg-stone-50/70'">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em]" :class="rotationHasPortrait ? 'text-emerald-700' : 'text-slate-500'">Portrait</p>
                    <p class="mt-2 text-sm font-medium" :class="rotationHasPortrait ? 'text-emerald-900' : 'text-slate-700'">
                      {{ rotationHasPortrait ? 'OK' : 'A faire' }}
                    </p>
                  </div>
                  <div class="rounded-[20px] border px-4 py-4" :class="rotationHasLandscape ? 'border-emerald-200 bg-emerald-50' : 'border-stone-300/80 bg-stone-50/70'">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em]" :class="rotationHasLandscape ? 'text-emerald-700' : 'text-slate-500'">Paysage</p>
                    <p class="mt-2 text-sm font-medium" :class="rotationHasLandscape ? 'text-emerald-900' : 'text-slate-700'">
                      {{ rotationHasLandscape ? 'OK' : 'A faire' }}
                    </p>
                  </div>
                </div>
                <p class="mt-4 text-sm text-slate-600">
                  {{ rotationUiReady ? 'Les deux positions ont bien ete vues.' : 'Fais encore pivoter le telephone pour valider les deux positions.' }}
                </p>
              </div>

              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Repere visuel</p>
                <div class="mt-5 flex justify-center">
                  <div class="rounded-[28px] border border-stone-300 bg-stone-100 p-4">
                    <div
                      class="rounded-[22px] border border-stone-300 bg-white transition-all duration-300"
                      :class="rotationHasLandscape ? 'h-28 w-44' : 'h-44 w-28'"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="isAccelerometerTest && guidedState.phase === 'active'" class="space-y-4">
            <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Inclinaison</p>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">Incline le telephone a plat</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Garde le telephone face a toi puis penche-le a gauche, a droite, vers le haut et vers le bas.
              </p>
              <p class="mt-3 text-sm font-medium" :class="sensorPermissionState === 'denied' ? 'text-amber-700' : 'text-slate-700'">
                {{
                  sensorPermissionState === 'denied'
                    ? 'Le mouvement n’est pas accessible. Tu pourras tout de meme donner ton ressenti.'
                    : 'Continue jusqu’a voir les quatre directions passer au vert.'
                }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="direction in [
                  { key: 'up', label: 'Haut' },
                  { key: 'down', label: 'Bas' },
                  { key: 'left', label: 'Gauche' },
                  { key: 'right', label: 'Droite' }
                ]"
                :key="direction.key"
                class="rounded-[20px] border px-4 py-4"
                :class="accelerometerObservedTilts.includes(direction.key) ? 'border-emerald-200 bg-emerald-50' : 'border-stone-300/80 bg-stone-50/70'"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.16em]" :class="accelerometerObservedTilts.includes(direction.key) ? 'text-emerald-700' : 'text-slate-500'">
                  {{ direction.label }}
                </p>
                <p class="mt-2 text-sm font-medium" :class="accelerometerObservedTilts.includes(direction.key) ? 'text-emerald-900' : 'text-slate-700'">
                  {{ accelerometerObservedTilts.includes(direction.key) ? 'Observee' : 'En attente' }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Progression</p>
                <p class="mt-3 text-sm text-slate-600">
                  {{ accelerometerTiltReady ? 'Les quatre inclinaisons ont bien reagi.' : 'Continue a incliner le telephone dans chaque direction.' }}
                </p>
              </div>

              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Repere visuel</p>
                <div class="mt-5 flex justify-center">
                  <div class="rounded-[28px] border border-stone-300 bg-stone-100 p-4">
                    <div
                      class="h-40 w-28 rounded-[22px] border border-stone-300 bg-white transition-transform duration-300"
                      :style="{
                        transform:
                          accelerometerCurrentTilt === 'left'
                            ? 'rotate(-10deg) translateX(-10px)'
                            : accelerometerCurrentTilt === 'right'
                              ? 'rotate(10deg) translateX(10px)'
                              : accelerometerCurrentTilt === 'up'
                                ? 'translateY(-10px)'
                                : accelerometerCurrentTilt === 'down'
                                  ? 'translateY(10px)'
                                  : 'translateY(0)'
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="isGyroscopeTest && guidedState.phase === 'active'" class="space-y-4">
            <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rotation</p>
              <h2 class="mt-2 text-2xl font-bold text-slate-950">Fais pivoter le telephone</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Tourne le telephone autour de lui-meme dans plusieurs orientations pour reveiller les trois axes gyroscopiques.
              </p>
              <p class="mt-3 text-sm font-medium" :class="sensorPermissionState === 'denied' ? 'text-amber-700' : 'text-slate-700'">
                {{
                  sensorPermissionState === 'denied'
                    ? 'Le mouvement n’est pas accessible. Tu pourras tout de meme donner ton ressenti.'
                    : 'Continue a faire pivoter le telephone jusqu’a valider les trois directions.'
                }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                v-for="axis in [
                  { key: 'alpha', label: 'Axe alpha' },
                  { key: 'beta', label: 'Axe beta' },
                  { key: 'gamma', label: 'Axe gamma' }
                ]"
                :key="axis.key"
                class="rounded-[20px] border px-4 py-4"
                :class="gyroscopeObservedAxes.includes(axis.key) ? 'border-emerald-200 bg-emerald-50' : 'border-stone-300/80 bg-stone-50/70'"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.16em]" :class="gyroscopeObservedAxes.includes(axis.key) ? 'text-emerald-700' : 'text-slate-500'">
                  {{ axis.label }}
                </p>
                <p class="mt-2 text-sm font-medium" :class="gyroscopeObservedAxes.includes(axis.key) ? 'text-emerald-900' : 'text-slate-700'">
                  {{ gyroscopeObservedAxes.includes(axis.key) ? 'Observe' : 'En attente' }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Progression</p>
                <p class="mt-3 text-sm text-slate-600">
                  {{ gyroscopeAxesReady ? 'Les trois mouvements ont bien reagi.' : 'Continue a faire pivoter le telephone dans plusieurs sens.' }}
                </p>
              </div>

              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Repere visuel</p>
                <div class="mt-5 flex justify-center">
                  <div class="rounded-[28px] border border-stone-300 bg-stone-100 p-4">
                    <div
                      class="h-40 w-28 rounded-[22px] border border-stone-300 bg-white transition-transform duration-300"
                      :style="{
                        transform:
                          gyroscopeCurrentAxis === 'alpha'
                            ? 'rotate(14deg)'
                            : gyroscopeCurrentAxis === 'beta'
                              ? 'rotateX(24deg)'
                              : gyroscopeCurrentAxis === 'gamma'
                                ? 'rotateY(24deg)'
                                : 'rotate(0deg)'
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
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
            <div class="space-y-4">
              <div class="rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-5">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Microphone</p>
                    <h2 class="mt-2 text-2xl font-bold text-slate-950">Fais monter le signal audio</h2>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      Parle, souffle ou tapote pres du micro. Verifie que le signal reagit puis passe manuellement a la validation.
                    </p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" :class="badgeClass">
                    {{ badgeLabel }}
                  </span>
                </div>
              </div>

              <MicrophoneLivePanel
                hint="Parle ou tapote pres du micro. La courbe doit reagir rapidement."
                :level="microphoneLevel"
                :peak-level="microphonePeakLevel"
                :sound-detected="microphoneSoundDetected"
                :permission-state="String(guidedState.metrics.permissionState ?? microphoneRuntime.permissionState.value)"
                :waveform="microphoneWaveform"
              />

              <div class="flex justify-end">
                <AppButton variant="secondary" @click="retryMicrophoneTest">Relancer le micro</AppButton>
              </div>
            </div>
          </section>

          <section v-else-if="isMediaTest && ['active', 'confirm'].includes(guidedState.phase)">
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
                :active-device-label="cameraRuntime.activeDeviceLabel.value"
                :available-devices="selectedCameraDevices"
                :selected-device-id="cameraActiveDeviceId"
                :show-device-selector="showRearDeviceSelector"
                :show-target="isAutofocusTest"
                :target-label="autofocusTargetLabel"
                @switch-device="switchRearDevice"
                @preview-ready-change="handleCameraPreviewReadyChange"
              />
            </div>

            <div v-if="props.testId === 'camera-rear'" class="mt-4 rounded-[24px] border border-stone-300/80 bg-[color:var(--color-surface)] p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Objectifs</p>
                  <p class="mt-1 text-sm text-slate-600">
                    {{ rearRemainingObjectiveCount === 0 ? 'Toutes les vues ont bien ete prises.' : `${rearRemainingObjectiveCount} vue${rearRemainingObjectiveCount > 1 ? 's' : ''} restante${rearRemainingObjectiveCount > 1 ? 's' : ''}.` }}
                  </p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]" :class="rearAllObjectivesCaptured ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-slate-700'">
                  {{ rearCapturedDeviceIds.length }}/{{ rearAvailableDeviceIds.length || selectedCameraDevices.length }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  v-for="device in selectedCameraDevices"
                  :key="device.deviceId"
                  class="rounded-[20px] border px-4 py-4"
                  :class="rearCapturedDeviceIds.includes(device.deviceId) ? 'border-emerald-200 bg-emerald-50' : cameraActiveDeviceId === device.deviceId ? 'border-slate-300 bg-stone-50' : 'border-stone-300/80 bg-[color:var(--color-surface)]'"
                >
                  <p class="text-xs font-semibold uppercase tracking-[0.16em]" :class="rearCapturedDeviceIds.includes(device.deviceId) ? 'text-emerald-700' : 'text-slate-500'">
                    {{ device.label }}
                  </p>
                  <p class="mt-2 text-sm font-medium" :class="rearCapturedDeviceIds.includes(device.deviceId) ? 'text-emerald-900' : 'text-slate-700'">
                    {{
                      rearCapturedDeviceIds.includes(device.deviceId)
                          ? 'ok'
                        : cameraActiveDeviceId === device.deviceId
                          ? 'en cours'
                          : 'a faire'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>

      <template #actions>
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
  getVisibleCurrentIndex,
  getVisibleProgressModel,
  getVisibleSubStepMeta,
  getVisibleTestId,
  getVisibleTestIds
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
const currentVisibleTestId = computed(() => getVisibleTestId(props.testId))
const visibleSubStepMeta = computed(() => getVisibleSubStepMeta(props.testId))
const visibleTestIds = computed(() => getVisibleTestIds(session.value?.steps.map((entry) => entry.testId) ?? []))
const visibleProgress = computed(() => getVisibleProgressModel(session.value?.steps ?? [], props.testId))
const currentIndex = computed(() => getVisibleCurrentIndex(session.value?.steps.map((entry) => entry.testId) ?? [], props.testId))
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
const isCameraCaptureTest = computed(() => ['camera-rear', 'camera-front'].includes(props.testId))
const isAutofocusTest = computed(() => props.testId === 'autofocus')
const isMicrophoneTest = computed(() => props.testId === 'microphone')
const isMultitouchTest = computed(() => props.testId === 'multitouch')
const isMediaTest = computed(() => isCameraCaptureTest.value || isAutofocusTest.value)
const supportsIssueReporting = computed(() =>
  ['microphone', 'camera-rear', 'camera-front', 'autofocus'].includes(props.testId)
)
const subjectiveIssueReported = computed(() => guidedState.value?.userVerdict === 'warning')
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
const getMetricStringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
const cameraPreviewReady = computed(() => Boolean(guidedState.value?.metrics.previewReady))
const rearAvailableDeviceIds = computed(() => getMetricStringList(guidedState.value?.metrics.availableDeviceIds))
const rearCapturedDeviceIds = computed(() => getMetricStringList(guidedState.value?.metrics.capturedDeviceIds))
const rearTestedDeviceIds = computed(() => getMetricStringList(guidedState.value?.metrics.testedDeviceIds))
const currentRearObjectiveCaptured = computed(() =>
  props.testId === 'camera-rear' &&
  Boolean(cameraActiveDeviceId.value && rearCapturedDeviceIds.value.includes(cameraActiveDeviceId.value))
)
const rearAllObjectivesCaptured = computed(() => {
  if (props.testId !== 'camera-rear') {
    return false
  }

  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  return availableIds.length > 0 && availableIds.every((deviceId) => rearCapturedDeviceIds.value.includes(deviceId))
})
const rearRemainingObjectiveCount = computed(() => {
  if (props.testId !== 'camera-rear') {
    return 0
  }

  const availableIds = rearAvailableDeviceIds.value.length > 0
    ? rearAvailableDeviceIds.value
    : selectedCameraDevices.value.map((device) => device.deviceId)

  return availableIds.filter((deviceId) => !rearCapturedDeviceIds.value.includes(deviceId)).length
})
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
const multitouchActiveTouches = computed(() => Number(guidedState.value?.metrics.activeTouches ?? 0))
const multitouchMaxSimultaneousTouches = computed(() => Number(guidedState.value?.metrics.maxSimultaneousTouches ?? 0))
const rotationObservedOrientations = computed(() => {
  const value = guidedState.value?.metrics.observedOrientations
  return Array.isArray(value) ? value : []
})
const rotationHasPortrait = computed(() => rotationObservedOrientations.value.includes('portrait'))
const rotationHasLandscape = computed(() => rotationObservedOrientations.value.includes('landscape'))
const rotationUiReady = computed(() => rotationHasPortrait.value && rotationHasLandscape.value)
const accelerometerCurrentTilt = computed(() => String(guidedState.value?.metrics.currentTilt ?? 'none'))
const accelerometerObservedTilts = computed(() => {
  const value = guidedState.value?.metrics.observedTilts
  return Array.isArray(value) ? value : []
})
const accelerometerTiltReady = computed(() => ['left', 'right', 'up', 'down'].every((direction) => accelerometerObservedTilts.value.includes(direction)))
const gyroscopeCurrentAxis = computed(() => String(guidedState.value?.metrics.currentAxis ?? 'none'))
const gyroscopeObservedAxes = computed(() => {
  const value = guidedState.value?.metrics.observedAxes
  return Array.isArray(value) ? value : []
})
const gyroscopeAxesReady = computed(() => ['alpha', 'beta', 'gamma'].every((axis) => gyroscopeObservedAxes.value.includes(axis)))
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

const helperText = computed(() => {
  if (props.testId === 'device-info') {
    return 'Preparation rapide du telephone.'
  }

  if (step.value?.status === 'running' && testDefinition.value?.mode === 'automatic') {
    return 'Verification en cours.'
  }

  if (step.value?.result) {
    return visibleSubStepMeta.value ? `${productTestCopy.value.label} est termine.` : 'Cette etape est terminee.'
  }

  if (testDefinition.value?.mode === 'guided') {
    if (currentGuidedSubStep.value?.label) {
      return currentGuidedSubStep.value.label
    }

    return 'Suis simplement la consigne a l’ecran.'
  }

  return 'Lance la verification.'
})
const visibleSubStepLabel = computed(() => {
  if (!visibleSubStepMeta.value || visibleSubStepMeta.value.total <= 1) {
    return ''
  }

  const currentLabel = currentGuidedSubStep.value?.label ?? testDefinition.value?.name ?? 'Sous-etape'

  return `${visibleSubStepMeta.value.current} / ${visibleSubStepMeta.value.total} dans ${visibleSubStepMeta.value.label} · ${currentLabel}`
})

const badgeLabel = computed(() => {
  if (!step.value?.result) {
    return step.value?.status === 'running' ? 'en cours' : 'a faire'
  }

  if (step.value.result.status === 'pass') {
    return 'ok'
  }

  if (step.value.result.status === 'failed') {
    return 'attention'
  }

  return 'a verifier'
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

const launchButtonLabel = computed(() => {
  if (isAccelerometerTest.value || isGyroscopeTest.value || isSensorTest.value || isMediaTest.value || isMicrophoneTest.value) {
    return 'Autoriser'
  }

  return 'Commencer'
})

const mediaPrimaryActionLabel = computed(() => {
  if (isCameraCaptureTest.value) {
    if (!cameraPreviewReady.value) {
      return 'Initialisation...'
    }

    if (props.testId === 'camera-rear' && currentRearObjectiveCaptured.value && !rearAllObjectivesCaptured.value) {
      return 'Changer d’objectif'
    }

    if (props.testId === 'camera-rear' && rearAllObjectivesCaptured.value) {
      return 'Continuer'
    }

    return currentCaptureUrl.value ? 'Valider la photo' : 'Prendre une photo'
  }

  if (currentAutofocusStepId.value === 'autofocus-near') {
    return 'Etape suivante'
  }

  if (currentAutofocusStepId.value === 'autofocus-far') {
    return 'Continuer'
  }

  return 'Continuer'
})

const mediaPrimaryActionDisabled = computed(() => {
  if (!isCameraCaptureTest.value) {
    return false
  }

  if (!cameraPreviewReady.value) {
    return true
  }

  if (props.testId === 'camera-rear' && currentRearObjectiveCaptured.value && !rearAllObjectivesCaptured.value) {
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
    void finalizeAndAdvance('pass')
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
  const result = await store.runTest(props.sessionId, props.testId)

  if (result) {
    await navigateNext()
  }
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

const finalizeAndAdvance = async (verdict?: DiagnosticGuidedUserVerdict | null) => {
  stopActiveRuntimes()

  if (verdict !== undefined) {
    store.setGuidedUserVerdict(props.sessionId, props.testId, verdict)
  }

  store.finalizeGuidedTest(props.sessionId, props.testId)
  await navigateNext()
}

const syncCameraMetrics = (overrides?: Record<string, string | number | boolean | null | string[]>) => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    supported: cameraRuntime.supported.value,
    permissionState: cameraRuntime.permissionState.value,
    streamOpened: cameraRuntime.streamActive.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    activeDeviceId: cameraRuntime.activeDeviceId.value,
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
    permissionState: permission,
    previewReady: false,
    activeDeviceId: null,
    availableDeviceIds: selectedCameraDevices.value.map((device) => device.deviceId)
  })

  if (permission === 'denied' || permission === 'not_supported') {
    return
  }

  const stream = await cameraRuntime.startStream({
    facingMode: props.testId === 'camera-front' ? 'user' : 'environment'
  })

  syncCameraMetrics({
    streamOpened: Boolean(stream),
    activeDeviceId: cameraRuntime.activeDeviceId.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    previewReady: false,
    availableDeviceIds: selectedCameraDevices.value.map((device) => device.deviceId),
    ...(props.testId === 'camera-rear'
      ? {
          testedDeviceIds: [],
          capturedDeviceIds: [],
          captureSucceeded: false,
          capturePreviewAvailable: false
        }
      : {})
  })
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
            void finalizeAndAdvance('pass')
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
            void finalizeAndAdvance('pass')
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
          void finalizeAndAdvance('pass')
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
        void finalizeAndAdvance('pass')
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
  const activeDeviceId = cameraActiveDeviceId.value

  if (props.testId === 'camera-rear' && !activeDeviceId) {
    syncCameraMetrics({
      captureSucceeded: false,
      capturePreviewAvailable: false
    })
    return
  }

  if (!dataUrl) {
    syncCameraMetrics({
      captureSucceeded: false,
      capturePreviewAvailable: false
    })
    return
  }

  setSessionCapture(props.sessionId, props.testId, dataUrl)

  const testedDeviceIds =
    props.testId === 'camera-rear' && activeDeviceId
      ? Array.from(new Set([...rearTestedDeviceIds.value, activeDeviceId]))
      : rearTestedDeviceIds.value
  const capturedDeviceIds =
    props.testId === 'camera-rear' && activeDeviceId
      ? Array.from(new Set([...rearCapturedDeviceIds.value, activeDeviceId]))
      : rearCapturedDeviceIds.value
  const availableDeviceIds =
    props.testId === 'camera-rear'
      ? selectedCameraDevices.value.map((device) => device.deviceId)
      : rearAvailableDeviceIds.value

  syncCameraMetrics({
    captureSucceeded: true,
    capturePreviewAvailable: true,
    ...(props.testId === 'camera-rear'
      ? {
          testedDeviceIds,
          capturedDeviceIds,
          availableDeviceIds
        }
      : {})
  })
}

const switchRearDevice = async (deviceId: string) => {
  if (props.testId !== 'camera-rear') {
    return
  }

  clearSessionCapture(props.sessionId, props.testId)
  const stream = await cameraRuntime.switchDevice(deviceId)
  syncCameraMetrics({
    streamOpened: Boolean(stream),
    activeDeviceId: cameraRuntime.activeDeviceId.value,
    activeDeviceLabel: cameraRuntime.activeDeviceLabel.value,
    previewReady: false,
    capturePreviewAvailable: false,
    captureSucceeded: rearAllObjectivesCaptured.value,
    availableDeviceIds: selectedCameraDevices.value.map((device) => device.deviceId)
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
    void finalizeAndAdvance()
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
    void finalizeAndAdvance()
    return
  }

  store.completeGuidedStep(props.sessionId, props.testId)
}

const finishTouchCollection = (mode: 'auto' | 'gesture') => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    completedAutomatically: mode === 'auto',
    completedByGesture: mode === 'gesture'
  })
  void finalizeAndAdvance(mode === 'auto' ? 'pass' : 'warning')
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
    void finalizeAndAdvance('pass')
  }
}

const finishMultitouchCollection = (verdict: DiagnosticGuidedUserVerdict) => {
  void finalizeAndAdvance(verdict)
}

const finishSensorCollection = (verdict: DiagnosticGuidedUserVerdict) => {
  void finalizeAndAdvance(verdict)
}

const finishMicrophoneCollection = () => {
  store.updateGuidedMetrics(props.sessionId, props.testId, {
    streamOpened: Boolean(microphoneRuntime.activeStream.value),
    level: microphoneRuntime.level.value,
    peakLevel: microphoneRuntime.peakLevel.value,
    soundDetected: microphoneRuntime.soundDetected.value
  })
  void finalizeAndAdvance()
}

const handleMediaPrimaryAction = () => {
  if (isCameraCaptureTest.value) {
    if (!cameraPreviewReady.value) {
      return
    }

    if (props.testId === 'camera-rear' && currentRearObjectiveCaptured.value && !rearAllObjectivesCaptured.value) {
      return
    }

    if (!currentCaptureUrl.value || (props.testId === 'camera-rear' && !currentRearObjectiveCaptured.value)) {
      captureCameraFrame()
      return
    }

    if (props.testId === 'camera-rear' && !rearAllObjectivesCaptured.value) {
      return
    }

    if (props.testId === 'camera-rear') {
      void finalizeAndAdvance()
      return
    }

    void finalizeAndAdvance()
    return
  }

  validateAutofocusStep()
}

const goNext = async () => {
  stopActiveRuntimes()
  await navigateNext()
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

    autoStartedTestKey.value = key
    void launchGuidedTest()
  },
  { immediate: true }
)
</script>
