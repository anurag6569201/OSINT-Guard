import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { phishingSims } from '../data/osintDummy'

function PhishingEmail({
  sim,
  index,
}: {
  sim: (typeof phishingSims)[number]
  index: number
}) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.article
      ref={ref}
      className="phishing-email"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Phishing simulation: ${sim.title}`}
    >
      <div className="phishing-email__header">
        <div className="phishing-email__title-group">
          <p className="phishing-email__num">Simulation {String(index + 1).padStart(2, '0')}</p>
          <h3 className="phishing-email__title">{sim.title}</h3>
        </div>
        <span className="phishing-email__sim-tag">⚠ Not real</span>
      </div>

      <div className="phishing-email__meta" role="group" aria-label="Email headers">
        <div className="phishing-email__meta-field">
          <span className="phishing-email__meta-key">From</span>
          <span className="phishing-email__meta-val">{sim.from}</span>
        </div>
        <div className="phishing-email__meta-field">
          <span className="phishing-email__meta-key">To</span>
          <span className="phishing-email__meta-val">{sim.to}</span>
        </div>
        <div
          className="phishing-email__meta-field"
          style={{ gridColumn: 'span 2' }}
        >
          <span className="phishing-email__meta-key">Subject</span>
          <span
            className="phishing-email__meta-val"
            style={{
              fontFamily: 'var(--sans)',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            {sim.subject}
          </span>
        </div>
      </div>

      <motion.pre
        className="phishing-email__body"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: index * 0.1 + 0.25, duration: 0.5 }}
      >
        {sim.body}
      </motion.pre>

      <div className="phishing-email__why">
        <span className="phishing-email__why-tag">Why it works</span>
        <p className="phishing-email__why-text">{sim.why}</p>
      </div>
    </motion.article>
  )
}

export function SpearPhishingSims() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className="phishing-section" aria-labelledby="phish-heading">
      <motion.div
        ref={headerRef}
        className="phishing-header"
        initial={{ opacity: 0, y: 24 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="section__eyebrow">
          <span className="section__eyebrow-line" />
          Spear-phishing simulations
        </p>
        <h2 id="phish-heading" className="phishing-title">
          Your data as bait
        </h2>
        <p className="phishing-lead">
          Mock emails showing how public posts become precision attack vectors.{' '}
          <strong>Educational demo only</strong> — no real email was sent.
        </p>
      </motion.div>

      <div className="phishing-list">
        {phishingSims.map((sim, i) => (
          <PhishingEmail key={sim.id} sim={sim} index={i} />
        ))}
      </div>
    </section>
  )
}
