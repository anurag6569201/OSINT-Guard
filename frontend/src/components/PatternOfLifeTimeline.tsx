import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { patternOfLife, polInference } from '../data/osintDummy'

function PolItem({
  item,
  index,
}: {
  item: (typeof patternOfLife)[number]
  index: number
}) {
  const ref = useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.li
      ref={ref}
      className="pol-item"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="pol-item__num">0{index + 1}</span>

      <div className="pol-item__center">
        <p className="pol-item__place">{item.place}</p>
        <p className="pol-item__detail">{item.detail}</p>
        <p className="pol-item__source">{item.source}</p>
      </div>

      {item.period ? (
        <span className="pol-item__period">{item.period}</span>
      ) : (
        <span className="pol-item__period" style={{ color: 'var(--text-dim)' }}>
          Hometown
        </span>
      )}
    </motion.li>
  )
}

export function PatternOfLifeTimeline() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const alertRef = useRef<HTMLDivElement>(null)
  const alertInView = useInView(alertRef, { once: true, margin: '-40px' })

  return (
    <section className="pol-section" aria-labelledby="pol-heading">
      <motion.div
        ref={headerRef}
        className="pol-header"
        initial={{ opacity: 0, y: 24 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p
            className="section__eyebrow"
            style={{ marginBottom: 12 }}
          >
            <span className="section__eyebrow-line" />
            Pattern of life
          </p>
          <h2 id="pol-heading" className="pol-title">
            Physical movement map
          </h2>
        </div>
        <span className="pol-count">{patternOfLife.length} locations</span>
      </motion.div>

      <ol className="pol-list" aria-label="Location timeline">
        {patternOfLife.map((item, i) => (
          <PolItem key={item.id} item={item} index={i} />
        ))}
      </ol>

      <motion.div
        ref={alertRef}
        className="pol-alert"
        role="note"
        aria-live="polite"
        initial={{ opacity: 0, x: -20 }}
        animate={alertInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="pol-alert__tag">Security&nbsp;inference</span>
        <p className="pol-alert__text">{polInference}</p>
      </motion.div>
    </section>
  )
}
