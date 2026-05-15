import { motion, useInView } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { useAiInsights } from '../context/AiInsightsContext'
import { firstSentence, truncateMiddle } from '../lib/textDigest'

const LINKS = [
  { href: '#exec-heading', label: 'Full report' },
  { href: '#intelligence-dashboard', label: 'Dashboard' },
  { href: '#pattern-of-life', label: 'Locations' },
  { href: '#pii-heading', label: 'Inferences' },
  { href: '#phish-heading', label: 'Phishing demos' },
  { href: '#method-heading', label: 'Method' },
] as const

export function AnalysisAtAGlance() {
  const { executive, inferenceRows, polInference, phishingSims } = useAiInsights()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const riskMax = executive.riskMax || 100
  const tier =
    executive.riskScore >= 67 ? 'High' : executive.riskScore >= 34 ? 'Medium' : 'Lower'

  const bullets = useMemo(() => {
    const lines: string[] = []
    const sum = firstSentence(executive.summary, 220)
    if (sum) {
      lines.push(sum)
    } else {
      lines.push(
        `${tier} assessed privacy exposure — score ${executive.riskScore} / ${riskMax}.`,
      )
    }
    if (polInference) {
      lines.push(truncateMiddle(polInference, 140))
    }
    const inf = inferenceRows[0]
    if (inf) {
      lines.push(`May infer “${inf.inferredValue}” from ${inf.targetInfo.toLowerCase()}.`)
    }
    const ph = phishingSims[0]
    if (ph && lines.length < 3) {
      lines.push(`Credible lure angle: ${truncateMiddle(ph.title, 72)}`)
    }
    return lines.slice(0, 3)
  }, [executive, inferenceRows, phishingSims, polInference, riskMax, tier])

  return (
    <motion.section
      ref={ref}
      className="at-a-glance"
      aria-labelledby="glance-heading"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="at-a-glance__inner">
        <div className="at-a-glance__head">
          <p id="glance-heading" className="at-a-glance__title">
            At a glance
          </p>
          <p className="at-a-glance__meta">
            {tier} risk · {executive.riskScore}/{riskMax}
          </p>
        </div>
        <ul className="at-a-glance__bullets" aria-label="Key takeaways">
          {bullets.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <nav className="at-a-glance__nav" aria-label="Jump to report sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="at-a-glance__link">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </motion.section>
  )
}
