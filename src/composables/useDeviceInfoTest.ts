import type { DiagnosticTestDefinition, DiagnosticTestDetail, DiagnosticTestRunResult, TestStatus } from '../domain/diagnostic'

const detectEnvironment = () => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform || 'indisponible'
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(userAgent)

  return {
    userAgent,
    platform,
    isIOS,
    isSafari
  }
}

const getOrientation = () => {
  const orientation = screen.orientation?.type

  if (orientation) {
    return orientation
  }

  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

const buildStatus = (details: DiagnosticTestDetail[], isIOS: boolean, isSafari: boolean): TestStatus => {
  if (details.length === 0) {
    return 'failed'
  }

  if (isIOS && isSafari) {
    return 'pass'
  }

  return 'warning'
}

export const useDeviceInfoTest = (): DiagnosticTestDefinition => ({
  id: 'device-info',
  name: 'Informations appareil',
  description: 'Releve automatiquement les donnees utiles du navigateur et de l’ecran.',
  icon: 'iphone',
  mode: 'automatic',
  async run(): Promise<DiagnosticTestRunResult> {
    const startedAt = new Date().toISOString()
    const { userAgent, platform, isIOS, isSafari } = detectEnvironment()
    const details: DiagnosticTestDetail[] = [
      { label: 'User Agent', value: userAgent },
      { label: 'Plateforme', value: platform },
      { label: 'Langue', value: navigator.language || 'indisponible' },
      { label: 'Resolution ecran', value: `${screen.width} x ${screen.height}` },
      { label: 'Viewport', value: `${window.innerWidth} x ${window.innerHeight}` },
      { label: 'DPR', value: String(window.devicePixelRatio || 1) },
      { label: 'Orientation', value: getOrientation() },
      { label: 'Environnement detecte', value: isIOS && isSafari ? 'iPhone Safari probable' : 'hors cible principale' }
    ]

    const status = buildStatus(details, isIOS, isSafari)

    return {
      testId: 'device-info',
      status,
      summary:
        status === 'pass'
          ? 'Les informations appareil ont ete relevees sur un environnement compatible.'
          : 'Les informations appareil ont ete relevees, mais l’environnement n’est pas un iPhone Safari clair.',
      details,
      startedAt,
      finishedAt: new Date().toISOString()
    }
  }
})
