import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { inferenceRows } from '../data/osintDummy'

function InferenceItem({
  row,
  index,
}: {
  row: (typeof inferenceRows)[number]
  index: number
}) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const evidenceParts = row.evidence.split('(')
  const evidenceText = evidenceParts[0].trim()
  const confidence = evidenceParts[1]?.replace(')', '').trim()

  return (
    <motion.li
      ref={ref}
      className="inference-item"
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <p className="inference-item__label">{row.targetInfo}</p>
        <p className="inference-item__value">{row.inferredValue}</p>
      </div>

      <div>
        <p className="inference-item__evidence-label">Evidence</p>
        <p className="inference-item__evidence">{evidenceText}</p>
        {confidence && (
          <span className="confidence-pill confidence-pill--high">
            <span className="confidence-pill--dot" />
            {confidence} confidence
          </span>
        )}
      </div>
    </motion.li>
  )
}

export function InferenceTable() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className="inference-section" aria-labelledby="pii-heading">
      <motion.div
        ref={headerRef}
        className="inference-header"
        initial={{ opacity: 0, y: 24 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="section__eyebrow">
          <span className="section__eyebrow-line" />
          Exposed PII &amp; inference
        </p>
        <h2 id="pii-heading" className="inference-title">
          What an attacker knows
        </h2>
        <p className="inference-lead">
          Correlated from public posts. Each row represents knowledge derived
          without any hacking—just aggregation.
        </p>
      </motion.div>

      <ul className="inference-list" aria-label="Inferred personal data">
        {inferenceRows.map((row, i) => (
          <InferenceItem key={row.targetInfo} row={row} index={i} />
        ))}
      </ul>
    </section>
  )
}
