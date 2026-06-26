import type { DiagnosticTestDefinition, DiagnosticTestDetail, DiagnosticTestRunResult, TestStatus } from '../domain/diagnostic'

type PermissionNameSafe = 'camera' | 'microphone' | 'geolocation'

const permissionLabels: Record<PermissionNameSafe, string> = {
  camera: 'Camera',
  microphone: 'Microphone',
  geolocation: 'Geolocalisation'
}

const unsupportedDetail = (name: PermissionNameSafe): DiagnosticTestDetail => ({
  label: permissionLabels[name],
  value: 'verification non supportee par ce navigateur',
  status: 'not_supported'
})

const pendingDetail = (name: PermissionNameSafe): DiagnosticTestDetail => ({
  label: permissionLabels[name],
  value: 'etat non interrogeable a l’avance sur Safari iPhone',
  status: 'pending'
})

const queryPermission = async (name: PermissionNameSafe): Promise<DiagnosticTestDetail> => {
  if (name === 'camera' || name === 'microphone') {
    return pendingDetail(name)
  }

  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    return unsupportedDetail(name)
  }

  try {
    const result = await navigator.permissions.query({ name } as PermissionDescriptor)

    return {
      label: permissionLabels[name],
      value: result.state,
      status:
        result.state === 'granted'
          ? 'pass'
          : result.state === 'prompt'
            ? 'pending'
            : 'warning'
    }
  } catch {
    return unsupportedDetail(name)
  }
}

const aggregateStatus = (details: DiagnosticTestDetail[]): TestStatus => {
  if (details.some((detail) => detail.status === 'warning')) {
    return 'warning'
  }

  if (details.every((detail) => detail.status === 'not_supported')) {
    return 'not_supported'
  }

  if (details.some((detail) => detail.status === 'pending')) {
    return 'pending'
  }

  return 'pass'
}

export const usePermissionsTest = (): DiagnosticTestDefinition => ({
  id: 'permissions',
  name: 'Permissions',
  description: 'Inspecte les permissions cles avant les futurs tests media et capteurs.',
  icon: 'lock',
  automatic: true,
  async run(): Promise<DiagnosticTestRunResult> {
    const startedAt = new Date().toISOString()
    const details = await Promise.all([
      queryPermission('camera'),
      queryPermission('microphone'),
      queryPermission('geolocation')
    ])

    const status = aggregateStatus(details)

    return {
      testId: 'permissions',
      status,
      summary:
        status === 'pass'
          ? 'Les permissions essentielles sont deja accordees.'
          : 'Au moins une permission reste a confirmer ou n’est pas pleinement inspectable sur Safari.',
      details,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  }
})
