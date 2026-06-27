import type { DiagnosticSessionStep, TestStatus } from '../domain/diagnostic'

type VerdictTone = 'green' | 'orange' | 'red'
export type ProgressBlockState = 'completed' | 'current' | 'upcoming'
export type ProgressSubStepState = 'completed' | 'current' | 'upcoming'

interface ProductTestCopy {
  label: string
  description: string
}

interface VisibleTestGroup {
  id: string
  label: string
  description: string
  testIds: string[]
}

export interface ProgressSubStep {
  id: string
  label: string
  state: ProgressSubStepState
  completed: boolean
}

export interface ProgressBlock {
  id: string
  label: string
  state: ProgressBlockState
  expanded: boolean
  completionRatio: number
  subSteps: ProgressSubStep[]
}

export interface ProgressModel {
  blocks: ProgressBlock[]
  completed: number
  total: number
  percent: number
}

const VISIBLE_TEST_GROUPS: VisibleTestGroup[] = [
  {
    id: 'screen',
    label: 'Ecran',
    description: 'On verifie l’affichage, le tactile et le multitouch dans une meme sequence.',
    testIds: ['screen', 'touch', 'multitouch']
  },
  {
    id: 'movement',
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.',
    testIds: ['rotation', 'accelerometer', 'gyroscope', 'compass']
  },
  {
    id: 'sound',
    label: 'Son',
    description: 'On verifie simplement que le micro reagit bien.',
    testIds: ['microphone']
  },
  {
    id: 'camera',
    label: 'Camera',
    description: 'On verifie les cameras, la mise au point et les prises de vue utiles.',
    testIds: ['camera']
  },
  {
    id: 'location',
    label: 'Localisation',
    description: 'On verifie que le telephone retrouve bien sa position.',
    testIds: ['gps']
  }
]

const TEST_COPY: Record<string, ProductTestCopy> = {
  'device-info': {
    label: 'Identification',
    description: 'On verifie rapidement que le telephone repond normalement.'
  },
  screen: {
    label: 'Ecran',
    description: 'On verifie l’affichage, le tactile et le multitouch dans une meme sequence.'
  },
  movement: {
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
  },
  sound: {
    label: 'Son',
    description: 'On verifie simplement que le micro reagit bien.'
  },
  location: {
    label: 'Localisation',
    description: 'On verifie que le telephone retrouve bien sa position.'
  },
  microphone: {
    label: 'Son',
    description: 'On verifie simplement que le micro reagit bien.'
  },
  camera: {
    label: 'Camera',
    description: 'On verifie les cameras, la mise au point et les prises de vue utiles.'
  },
  touch: {
    label: 'Ecran',
    description: 'On verifie l’affichage, le tactile et le multitouch dans une meme sequence.'
  },
  multitouch: {
    label: 'Ecran',
    description: 'On verifie l’affichage, le tactile et le multitouch dans une meme sequence.'
  },
  rotation: {
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
  },
  accelerometer: {
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
  },
  gyroscope: {
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
  },
  compass: {
    label: 'Mouvements',
    description: 'On verifie les reactions du telephone quand on le tourne, l’incline ou l’oriente.'
  },
  gps: {
    label: 'Localisation',
    description: 'On verifie que le telephone retrouve bien sa position.'
  }
}

const getVisibleGroupByTestId = (testId: string) =>
  VISIBLE_TEST_GROUPS.find((group) => group.testIds.includes(testId))

export const getVisibleTestId = (testId: string) => getVisibleGroupByTestId(testId)?.id ?? testId
const getTestLabel = (testId: string) => TEST_COPY[testId]?.label ?? testId

export const getVisibleSubStepMeta = (testId: string) => {
  const group = getVisibleGroupByTestId(testId)

  if (!group) {
    return null
  }

  return {
    groupId: group.id,
    current: group.testIds.indexOf(testId) + 1,
    total: group.testIds.length,
    label: group.label,
    description: group.description
  }
}

export const getVisibleTestIds = (testIds: string[]) =>
  testIds.reduce<string[]>((visibleIds, testId) => {
    if (!getVisibleGroupByTestId(testId)) {
      return visibleIds
    }

    const visibleId = getVisibleTestId(testId)

    if (!visibleIds.includes(visibleId)) {
      visibleIds.push(visibleId)
    }

    return visibleIds
  }, [])

export const getVisibleCurrentIndex = (testIds: string[], currentTestId: string) => {
  const visibleIds = getVisibleTestIds(testIds)
  const currentVisibleId = getVisibleTestId(currentTestId)
  const directIndex = visibleIds.findIndex((visibleId) => visibleId === currentVisibleId)

  if (directIndex !== -1) {
    return directIndex
  }

  const currentIndex = testIds.findIndex((testId) => testId === currentTestId)

  for (let index = currentIndex + 1; index < testIds.length; index += 1) {
    const nextVisibleId = getVisibleTestId(testIds[index])
    const nextVisibleIndex = visibleIds.findIndex((visibleId) => visibleId === nextVisibleId)

    if (nextVisibleIndex !== -1) {
      return nextVisibleIndex
    }
  }

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const previousVisibleId = getVisibleTestId(testIds[index])
    const previousVisibleIndex = visibleIds.findIndex((visibleId) => visibleId === previousVisibleId)

    if (previousVisibleIndex !== -1) {
      return previousVisibleIndex
    }
  }

  return -1
}

export const getVisibleProgress = (steps: DiagnosticSessionStep[]) => {
  const visibleIds = getVisibleTestIds(steps.map((step) => step.testId))
  const completedVisibleIds = visibleIds.filter((visibleId) => {
    const group = VISIBLE_TEST_GROUPS.find((entry) => entry.id === visibleId)
    const groupSteps = group
      ? steps.filter((step) => group.testIds.includes(step.testId))
      : steps.filter((step) => getVisibleTestId(step.testId) === visibleId)

    return groupSteps.length > 0 && groupSteps.every((step) => step.result !== null)
  })

  return {
    completed: completedVisibleIds.length,
    total: visibleIds.length,
    percent: visibleIds.length === 0 ? 0 : Math.round((completedVisibleIds.length / visibleIds.length) * 100)
  }
}

export const getVisibleProgressModel = (
  steps: DiagnosticSessionStep[],
  currentTestId?: string | null,
  options?: {
    expandCurrent?: boolean
  }
): ProgressModel => {
  const visibleProgress = getVisibleProgress(steps)
  const expandCurrent = options?.expandCurrent ?? true
  const currentVisibleId = currentTestId ? getVisibleTestId(currentTestId) : null
  const firstIncompleteVisibleId =
    getVisibleSummarySteps(steps).length < getVisibleTestIds(steps.map((step) => step.testId)).length
      ? getVisibleTestIds(steps.map((step) => step.testId)).find((visibleId) => {
          const group = VISIBLE_TEST_GROUPS.find((entry) => entry.id === visibleId)
          const groupSteps = group
            ? steps.filter((step) => group.testIds.includes(step.testId))
            : steps.filter((step) => getVisibleTestId(step.testId) === visibleId)

          return !groupSteps.every((step) => step.result !== null)
        }) ?? null
      : null
  const activeVisibleId = currentVisibleId ?? firstIncompleteVisibleId

  const blocks = VISIBLE_TEST_GROUPS.map<ProgressBlock>((group) => {
    const groupSteps = group.testIds
      .map((testId) => steps.find((step) => step.testId === testId))
      .filter((step): step is DiagnosticSessionStep => step !== undefined)
    const completedCount = groupSteps.filter((step) => step.result !== null).length
    const hasAnyIncomplete = completedCount < group.testIds.length
    const isCurrent = Boolean(activeVisibleId && activeVisibleId === group.id && hasAnyIncomplete)
    const isCompleted = group.testIds.length > 0 && completedCount >= group.testIds.length

    const subSteps = group.testIds.map<ProgressSubStep>((testId, index) => {
      const step = steps.find((entry) => entry.testId === testId)
      const completed = step?.result !== null
      const state: ProgressSubStepState = completed
        ? 'completed'
        : isCurrent && currentTestId === testId
          ? 'current'
          : isCurrent && !currentTestId && index === completedCount
            ? 'current'
            : 'upcoming'

      return {
        id: testId,
        label: getTestLabel(testId),
        state,
        completed
      }
    })

    return {
      id: group.id,
      label: group.label,
      state: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming',
      expanded: expandCurrent && isCurrent,
      completionRatio: group.testIds.length === 0 ? 0 : completedCount / group.testIds.length,
      subSteps
    }
  })

  return {
    ...visibleProgress,
    blocks
  }
}

export const getVisibleSummarySteps = (steps: DiagnosticSessionStep[]) =>
  getVisibleTestIds(steps.map((step) => step.testId))
    .map((visibleId) => {
      const group = VISIBLE_TEST_GROUPS.find((entry) => entry.id === visibleId)
      const groupSteps = group
        ? steps.filter((step) => group.testIds.includes(step.testId) && step.result !== null)
        : steps.filter((step) => getVisibleTestId(step.testId) === visibleId && step.result !== null)

      if (groupSteps.length === 0) {
        return null
      }

      const status = groupSteps.some((step) => step.result?.status === 'failed')
        ? 'failed'
        : groupSteps.some((step) => step.result?.status !== 'pass')
          ? 'warning'
          : 'pass'

      return {
        testId: visibleId,
        status,
        steps: groupSteps
      }
    })
    .filter((entry): entry is { testId: string; status: TestStatus; steps: DiagnosticSessionStep[] } => entry !== null)

export const getProductTestCopy = (testId: string, fallbackLabel: string) =>
  TEST_COPY[testId] ?? {
    label: fallbackLabel,
    description: 'On verifie simplement que cette fonction repond bien.'
  }

export const getStatusBucket = (status?: TestStatus) => {
  if (status === 'pass') {
    return 'ok'
  }

  if (status === 'failed') {
    return 'attention'
  }

  return 'verify'
}

export const getSimpleStepMessage = (step: DiagnosticSessionStep, fallbackLabel: string) => {
  const label = getProductTestCopy(getVisibleTestId(step.testId), fallbackLabel).label
  const bucket = getStatusBucket(step.result?.status)

  if (bucket === 'ok') {
    return `${label} semble bien fonctionner.`
  }

  if (bucket === 'attention') {
    return `${label} semble poser probleme.`
  }

  return `${label} merite une verification complementaire.`
}

export const getVerdictMeta = (steps: DiagnosticSessionStep[]) => {
  const summarySteps = getVisibleSummarySteps(steps)
  const hasFailed = summarySteps.some((step) => getStatusBucket(step.status) === 'attention')
  const hasWarning = summarySteps.some((step) => getStatusBucket(step.status) === 'verify')

  if (hasFailed) {
    return {
      tone: 'red' as VerdictTone,
      title: 'Attention a certains points',
      description: 'Le telephone ne semble pas parfaitement fiable sur toutes les verifications.'
    }
  }

  if (hasWarning) {
    return {
      tone: 'orange' as VerdictTone,
      title: 'Quelques points sont a verifier',
      description: 'Le telephone fonctionne globalement, mais quelques points meritent un controle.'
    }
  }

  return {
    tone: 'green' as VerdictTone,
    title: 'Tout semble fonctionner',
    description: 'Les verifications principales sont rassurantes.'
  }
}
