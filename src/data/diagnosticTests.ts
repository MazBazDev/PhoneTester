import type { DiagnosticTestDefinition } from '../domain/diagnostic'
import { useDeviceInfoTest } from '../composables/useDeviceInfoTest'
import { usePermissionsTest } from '../composables/usePermissionsTest'

export const diagnosticTests: DiagnosticTestDefinition[] = [useDeviceInfoTest(), usePermissionsTest()]

export const diagnosticTestMap = Object.fromEntries(diagnosticTests.map((test) => [test.id, test])) as Record<
  string,
  DiagnosticTestDefinition
>
