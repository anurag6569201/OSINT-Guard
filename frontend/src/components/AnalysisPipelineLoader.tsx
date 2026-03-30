import { motion, useReducedMotion } from 'framer-motion'
import type { PipelineStage } from '../types/analysisPipeline'

type Props = {
  stage: PipelineStage
  dataSource: 'dummy' | 'live'
}

const STAGE_COPY: Record<
  Exclude<PipelineStage, 'idle'>,
  { title: string; detail: string }
> = {
  collect: {
    title: 'Collecting public footprint',
    detail:
      'Running Apify actors against the handles you entered — LinkedIn profile & activity, X posts, and Instagram profile. This can take one to several minutes.',
  },
  analyze: {
    title: 'Assessing security & privacy exposure',
    detail:
      'Sending aggregated public data to Gemini for correlated risk scoring, cross-platform inferences, pattern-of-life cues, and spear-phishing-style simulations — all grounded in what was actually collected.',
  },
  demo_load: {
    title: 'Loading demonstration corpus',
    detail:
      'Reading curated sandbox JSON so you can explore the report UI without Apify or Gemini. Toggle live mode in env to run real collection.',
  },
}

export function AnalysisPipelineLoader({ stage, dataSource }: Props) {
  const reduce = useReducedMotion()
  const copy =
    stage === 'idle'
      ? {
          title: 'Preparing analysis',
          detail: 'Hang on while we get your report ready.',
        }
      : STAGE_COPY[stage]

  return (
    <div className="analysis-pipeline" role="status" aria-live="polite" aria-busy="true">
      <div className="analysis-pipeline__inner">
        <motion.div
          className="analysis-pipeline__orb"
          animate={
            reduce
              ? {}
              : {
                  scale: [1, 1.06, 1],
                  opacity: [0.85, 1, 0.85],
                }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <p className="analysis-pipeline__eyebrow">
          {dataSource === 'live' ? 'Live OSINT pipeline' : 'Demo mode'}
        </p>
        <h1 className="analysis-pipeline__title">{copy.title}</h1>
        <p className="analysis-pipeline__detail">{copy.detail}</p>
        <div className="analysis-pipeline__steps" aria-hidden="true">
          {dataSource === 'dummy' ? (
            <>
              <Step active={stage === 'demo_load'} label="Sandbox JSON" />
              <span className="analysis-pipeline__step-line" />
              <Step dim label="Full report" />
            </>
          ) : (
            <>
              <Step active={stage === 'collect'} done={stage === 'analyze'} label="Apify ingest" />
              <span className="analysis-pipeline__step-line" />
              <Step active={stage === 'analyze'} label="Gemini assessment" />
            </>
          )}
        </div>
        <p className="analysis-pipeline__hint">
          OSINT-Guard demonstrates how public social data — LinkedIn, X, Instagram — can be combined to
          surface security and privacy vulnerabilities (oversharing, cross-linking, and social-engineering
          surface).
        </p>
      </div>
    </div>
  )
}

function Step({
  active,
  done,
  dim,
  label,
}: {
  active?: boolean
  done?: boolean
  dim?: boolean
  label: string
}) {
  return (
    <span
      className={`analysis-pipeline__step${active ? ' analysis-pipeline__step--active' : ''}${done ? ' analysis-pipeline__step--done' : ''}${dim ? ' analysis-pipeline__step--dim' : ''}`}
    >
      {label}
    </span>
  )
}
