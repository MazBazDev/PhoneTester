export type TestStatus = 'pass' | 'warning' | 'failed' | 'skipped' | 'not_supported' | 'pending'

export type DiagnosticSessionStatus = 'draft' | 'completed'

export type DiagnosticStepState = 'pending' | 'running' | 'completed'

export type DiagnosticTestMode = 'automatic' | 'guided'

export type DiagnosticGuidedPhase = 'idle' | 'active' | 'confirm' | 'completed'

export type DiagnosticGuidedUserVerdict = 'pass' | 'warning' | 'failed'

export type DiagnosticMetricValue = string | number | boolean | null | string[]

export interface DiagnosticTestDetail {
  label: string
  value: string
  status?: TestStatus
  previewKey?: string
}

export interface DiagnosticTestRunResult {
  testId: string
  status: TestStatus
  summary: string
  details: DiagnosticTestDetail[]
  startedAt: string
  finishedAt: string
}

export interface DiagnosticGuidedSubStepState {
  id: string
  label: string
  instruction: string
  status: 'pending' | 'active' | 'completed'
  response: 'yes' | 'no' | null
  tone?: string
  color?: string
}

export interface DiagnosticGuidedState {
  phase: DiagnosticGuidedPhase
  startedAt: string | null
  currentStepIndex: number
  steps: DiagnosticGuidedSubStepState[]
  metrics: Record<string, DiagnosticMetricValue>
  userVerdict: DiagnosticGuidedUserVerdict | null
}

export interface DiagnosticTestDefinition {
  id: string
  name: string
  description: string
  icon: string
  mode: DiagnosticTestMode
  immersive?: boolean
  run?: () => Promise<DiagnosticTestRunResult>
  createGuidedState?: () => DiagnosticGuidedState
  finalizeGuidedResult?: (state: DiagnosticGuidedState) => DiagnosticTestRunResult
}

export interface DiagnosticSessionStep {
  testId: string
  status: DiagnosticStepState
  result: DiagnosticTestRunResult | null
  guidedState: DiagnosticGuidedState | null
}

export interface DiagnosticSession {
  id: string
  status: DiagnosticSessionStatus
  createdAt: string
  updatedAt: string
  deviceTarget: 'iphone-safari'
  steps: DiagnosticSessionStep[]
}
