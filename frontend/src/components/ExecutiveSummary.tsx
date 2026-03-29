import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useDatasets } from '../context/useDatasets'
import { executive, TARGET_NAME } from '../data/osintDummy'

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1200
    const step = 16
    const increment = target / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, step)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count}</span>
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' as const },
  }),
}

export function ExecutiveSummary() {
  const { targetName } = useDatasets()
  const displayName = targetName ?? TARGET_NAME
  const pct = (executive.riskScore / executive.riskMax) * 100

  const chips = [
    { label: '🔴 High risk', cls: 'hero__chip hero__chip--red' },
    { label: 'Cross-platform exposure', cls: 'hero__chip hero__chip--accent' },
    { label: 'Social engineering surface', cls: 'hero__chip' },
  ]

  return (
    <section className="hero" aria-labelledby="exec-heading">
      <div className="hero__inner">
        {/* Left: Identity */}
        <motion.div
          className="hero__left"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.p className="hero__label" variants={fadeUp} custom={0}>
            Intelligence report
          </motion.p>

          <motion.h1
            id="exec-heading"
            className="hero__name"
            variants={fadeUp}
            custom={1}
          >
            {displayName}
          </motion.h1>

          <motion.p className="hero__sub" variants={fadeUp} custom={2}>
            {executive.summary}
          </motion.p>

          <motion.div className="hero__chips" variants={fadeUp} custom={3}>
            {chips.map((c) => (
              <span key={c.label} className={c.cls}>
                {c.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Risk score */}
        <motion.div
          className="hero__right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-dim)',
                fontFamily: 'var(--mono)',
                marginBottom: 14,
              }}
            >
              Privacy risk score
            </p>

            <div className="score-display">
              <div className="score-display__number">
                <AnimatedNumber target={executive.riskScore} />
              </div>
              <div className="score-display__meta">
                <span className="score-display__max">/ {executive.riskMax}</span>
                <span className="score-display__label">High</span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div className="score-bar">
                <motion.div
                  className="score-bar__fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>

          <motion.div
            className="risk-verdict"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="risk-verdict__title">Verdict</p>
            <p className="risk-verdict__text">{executive.riskLabel}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
