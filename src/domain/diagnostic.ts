export type TestStatus = 'pass' | 'warning' | 'failed' | 'skipped' | 'not_supported' | 'pending'

export type DiagnosticSessionStatus = 'draft' | 'completed'

export type DiagnosticStepState = 'pending' | 'running' | 'completed'

export interface DiagnosticTestDetail {
  label: string
  value: string
  status?: TestStatus
}

export interface DiagnosticTestRunResult {
  testId: string
  status: TestStatus
  summary: string
  details: DiagnosticTestDetail[]
  startedAt: string
  finishedAt: string
}

export interface DiagnosticTestDefinition {
  id: string
  name: string
  description: string
  icon: string
  automatic: boolean
  run: () => Promise<DiagnosticTestRunResult>
}

export interface DiagnosticSessionStep {
  testId: string
  status: DiagnosticStepState
  result: DiagnosticTestRunResult | null
}

export interface DiagnosticSession {
  id: string
  status: DiagnosticSessionStatus
  createdAt: string
  updatedAt: string
  deviceTarget: 'iphone-safari'
  steps: DiagnosticSessionStep[]
}
