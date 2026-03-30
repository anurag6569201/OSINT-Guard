export type ExecutiveInsight = {
  riskScore: number
  riskMax: number
  riskLabel: string
  summary: string
}

export type TimelineEntry = {
  id: string
  place: string
  period?: string
  detail: string
  source: string
}

export type InferenceRow = {
  targetInfo: string
  inferredValue: string
  evidence: string
}

export type PhishingSim = {
  id: string
  title: string
  from: string
  to: string
  subject: string
  body: string
  why: string
}

export type MethodologyPillar = {
  title: string
  subtitle: string
  text: string
}

export type MethodologyInsight = {
  headline: string
  intro: string
  pillars: MethodologyPillar[]
}

export type AiInsightsBundle = {
  executive: ExecutiveInsight
  inferenceRows: InferenceRow[]
  patternOfLife: TimelineEntry[]
  polInference: string
  phishingSims: PhishingSim[]
  methodology: MethodologyInsight
}
