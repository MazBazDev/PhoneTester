import type { DiagnosticTestDefinition } from '../domain/diagnostic'
import { useDeviceInfoTest } from '../composables/useDeviceInfoTest'
import { usePermissionsTest } from '../composables/usePermissionsTest'
import { useScreenTest } from '../composables/useScreenTest'
import { useTouchTest } from '../composables/useTouchTest'
import { useRotationTest } from '../composables/useRotationTest'
import { useAccelerometerTest } from '../composables/useAccelerometerTest'
import { useGyroscopeTest } from '../composables/useGyroscopeTest'
import { useCompassTest } from '../composables/useCompassTest'
import { useGpsTest } from '../composables/useGpsTest'
import { useCameraRearTest } from '../composables/useCameraRearTest'
import { useCameraFrontTest } from '../composables/useCameraFrontTest'
import { useAutofocusTest } from '../composables/useAutofocusTest'

export const diagnosticTests: DiagnosticTestDefinition[] = [
  useDeviceInfoTest(),
  usePermissionsTest(),
  useScreenTest(),
  useTouchTest(),
  useRotationTest(),
  useAccelerometerTest(),
  useGyroscopeTest(),
  useCompassTest(),
  useGpsTest(),
  useCameraRearTest(),
  useCameraFrontTest(),
  useAutofocusTest()
]

export const diagnosticTestMap = Object.fromEntries(diagnosticTests.map((test) => [test.id, test])) as Record<
  string,
  DiagnosticTestDefinition
>
