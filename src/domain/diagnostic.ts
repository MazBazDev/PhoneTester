export type DiagnosticStatus = 'draft' | 'completed'

export interface PhoneProfile {
  brand: string
  model: string
  storage: string
}

export interface DiagnosticCheck {
  id: string
  label: string
  helper: string
}

export interface DiagnosticSection {
  id: string
  title: string
  description: string
  checks: DiagnosticCheck[]
}

export interface DiagnosticAnswer {
  checkId: string
  value: string
}

export interface DiagnosticSectionState extends DiagnosticSection {
  answers: DiagnosticAnswer[]
  completed: boolean
}

export interface DiagnosticSession {
  id: string
  status: DiagnosticStatus
  createdAt: string
  phoneProfile: PhoneProfile
  sections: DiagnosticSectionState[]
}
