import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useDatasets } from '../context/useDatasets'
import { executive, TARGET_NAME } from '../data/osintDummy'
import { pickAvatar, pickBanner, pickHeadline } from '../lib/profileMedia'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '?'
}

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
  const { targetName, data } = useDatasets()
  const displayName = targetName ?? TARGET_NAME
  const pct = (executive.riskScore / executive.riskMax) * 100

  const banner = useMemo(() => pickBanner(data), [data])
  const avatar = useMemo(() => pickAvatar(data), [data])
  const headline = useMemo(() => pickHeadline(data), [data])

  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null)

  const chips = [
    { label: 'High risk', cls: 'hero__chip hero__chip--red' },
    { label: 'Cross-platform exposure', cls: 'hero__chip hero__chip--accent' },
    { label: 'Social engineering surface', cls: 'hero__chip' },
  ]

  const showBannerImage = Boolean(
    banner.url && failedBannerUrl !== banner.url,
  )
  const showAvatarImage = Boolean(
    avatar.url && failedAvatarUrl !== avatar.url,
  )

  return (
    <section className="hero" aria-labelledby="exec-heading">
      <div className="hero__banner hero__banner--bleed">
        <div className="hero__banner-canvas">
          {showBannerImage && (
            <img
              className="hero__banner-img"
              src={banner.url!}
              alt={banner.source ? `Profile cover (${banner.source})` : 'Profile cover'}
              referrerPolicy="no-referrer"
              onError={() => banner.url && setFailedBannerUrl(banner.url)}
            />
          )}
          <div className="hero__banner-fallback" aria-hidden="true" />
          <div className="hero__banner-scrim" aria-hidden="true" />
        </div>
        <div className="hero__avatar-col hero__avatar-col--banner">
          <div className="hero__avatar-frame">
            {showAvatarImage ? (
              <img
                className="hero__avatar-img"
                src={avatar.url!}
                alt={avatar.source ? `Profile photo (${avatar.source})` : 'Profile photo'}
                referrerPolicy="no-referrer"
                onError={() => avatar.url && setFailedAvatarUrl(avatar.url)}
              />
            ) : (
              <span className="hero__avatar-fallback" aria-hidden="true">
                {initials(displayName)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hero__body">
        <div className="hero__shell">
        <div className="hero__inner">
          <div className="hero__left">
            <div className="hero__identity">
              <motion.div
                className="hero__copy"
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

                {headline && (
                  <motion.p className="hero__headline" variants={fadeUp} custom={2}>
                    {headline}
                  </motion.p>
                )}

                <motion.p className="hero__sub" variants={fadeUp} custom={headline ? 3 : 2}>
                  {executive.summary}
                </motion.p>

                <motion.div className="hero__chips" variants={fadeUp} custom={headline ? 4 : 3}>
                  {chips.map((c) => (
                    <span key={c.label} className={c.cls}>
                      {c.label}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="hero__right"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero__score-block">
              <p className="hero__score-label">Privacy risk score</p>

              <div className="score-display">
                <div className="score-display__number">
                  <AnimatedNumber target={executive.riskScore} />
                </div>
                <div className="score-display__meta">
                  <span className="score-display__max">/ {executive.riskMax}</span>
                  <span className="score-display__label">High</span>
                </div>
              </div>

              <div className="hero__score-bar-wrap">
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
        </div>
      </div>
    </section>
  )
}
