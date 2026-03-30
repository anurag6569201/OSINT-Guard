import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useAiInsights } from '../context/AiInsightsContext'

export function MethodologyFooter() {
  const { methodology } = useAiInsights()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const pillarsRef = useRef<HTMLDivElement>(null)
  const pillarsInView = useInView(pillarsRef, { once: true, margin: '-40px' })
  const mitigationRef = useRef<HTMLParagraphElement>(null)
  const mitigationInView = useInView(mitigationRef, { once: true, margin: '-40px' })

  return (
    <footer className="method-section" aria-labelledby="method-heading">
      <div className="method-inner">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="section__eyebrow" style={{ marginBottom: 20 }}>
            <span className="section__eyebrow-line" />
            Methodology
          </p>
          <h2 id="method-heading" className="method-headline">
            {methodology.headline}
          </h2>
          <p className="method-intro">{methodology.intro}</p>
        </motion.div>

        <motion.div
          ref={pillarsRef}
          className="method-pillars"
          initial="hidden"
          animate={pillarsInView ? 'show' : 'hidden'}
          variants={{
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {methodology.pillars.map((p, i) => (
            <motion.div
              key={p.title}
              className="method-pillar"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <p className="method-pillar__num">0{i + 1}</p>
              <h3 className="method-pillar__title">{p.title}</h3>
              <p className="method-pillar__sub">{p.subtitle}</p>
              <p className="method-pillar__text">{p.text}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          ref={mitigationRef}
          className="method-mitigation"
          initial={{ opacity: 0 }}
          animate={mitigationInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <strong>Mitigation:</strong> platform transparency on cross-platform
          linkability, compartmentalizing professional vs. personal personas,
          and context awareness—every post is a data point in aggregate.
        </motion.p>
      </div>
    </footer>
  )
}
