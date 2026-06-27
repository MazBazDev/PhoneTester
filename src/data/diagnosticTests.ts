import type { DiagnosticTestDefinition } from '../domain/diagnostic'
import { useDeviceInfoTest } from '../composables/useDeviceInfoTest'
import { useScreenTest } from '../composables/useScreenTest'
import { useTouchTest } from '../composables/useTouchTest'
import { useMultitouchTest } from '../composables/useMultitouchTest'
import { useRotationTest } from '../composables/useRotationTest'
import { useAccelerometerTest } from '../composables/useAccelerometerTest'
import { useGyroscopeTest } from '../composables/useGyroscopeTest'
import { useCompassTest } from '../composables/useCompassTest'
import { useGpsTest } from '../composables/useGpsTest'
import { useCameraTest } from '../composables/useCameraTest'
import { useMicrophoneTest } from '../composables/useMicrophoneTest'

export const diagnosticTests: DiagnosticTestDefinition[] = [
  useDeviceInfoTest(),
  useScreenTest(),
  useTouchTest(),
  useMultitouchTest(),
  useRotationTest(),
  useAccelerometerTest(),
  useGyroscopeTest(),
  useCompassTest(),
  useGpsTest(),
  useMicrophoneTest(),
  useCameraTest()
]

export const diagnosticTestMap = Object.fromEntries(diagnosticTests.map((test) => [test.id, test])) as Record<
  string,
  DiagnosticTestDefinition
>
