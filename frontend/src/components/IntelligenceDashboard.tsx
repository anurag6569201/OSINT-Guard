import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDatasets } from '../context/useDatasets'
import {
  buildDataQualityStrip,
  computeExposureRubric,
  computeIdentityLinkage,
  computeTopicOverlap,
  extractLinkSurface,
  linkedinReactorConcentration,
  postingActivityByHourUTC,
  scanPiiSignals,
} from '../lib/exposureAnalytics'
import { LocationIntelMap } from './LocationIntelMap'

const CHART_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#4f46e5']

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name?: string; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="intel-chart-tooltip">
      {label != null && <div className="intel-chart-tooltip__label">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.name)} className="intel-chart-tooltip__row">
          <span
            className="intel-chart-tooltip__dot"
            style={{ background: p.color ?? 'var(--accent)' }}
          />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function IntelSkeleton() {
  return (
    <div className="intel-skeleton" aria-hidden="true">
      <div className="intel-skeleton__bar intel-skeleton__bar--wide" />
      <div className="intel-skeleton__bar intel-skeleton__bar--narrow" />
      <div className="intel-skeleton__rows">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="intel-skeleton__row" />
        ))}
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function IntelligenceDashboard() {
  const {
    loading,
    error,
    data,
    dataSource,
    collectErrors,
    targetName,
    stats,
    twitterByMonth,
    mediaMix,
    skills,
    mapMarkers,
    linkedinAuthoredPosts,
    linkedinByMonth,
    linkedinReactionMix,
    linkedinHashtags,
    linkedinEngagement,
    linkedinCareer,
  } = useDatasets()

  const privacyAnalytics = useMemo(() => {
    if (!data) return null
    const ig = data.instagram ?? []
    const tw = data.twitter ?? []
    const li = data.linkedinProfile ?? []
    const liPosts = linkedinAuthoredPosts
    const igPosts = ig[0]?.latestPosts ?? []
    const topicOverlap = computeTopicOverlap(ig, tw, li, liPosts)
    const hourly = postingActivityByHourUTC(tw, liPosts, igPosts)
    const linkSurface = extractLinkSurface(ig, liPosts, tw)
    const identityLinkage = computeIdentityLinkage(ig, tw, li)
    const pii = scanPiiSignals(ig, liPosts, tw)
    const rubric = computeExposureRubric(
      ig,
      tw,
      li,
      liPosts,
      topicOverlap,
      pii,
      linkSurface.length,
    )
    const reactors = linkedinReactorConcentration(liPosts)
    const dataQuality = buildDataQualityStrip(data, dataSource, collectErrors)
    return {
      topicOverlap,
      hourly,
      linkSurface,
      identityLinkage,
      pii,
      rubric,
      reactors,
      dataQuality,
    }
  }, [data, linkedinAuthoredPosts, dataSource, collectErrors])

  const ig = data?.instagram[0]
  const tw = data?.twitter ?? []
  const liProfile = data?.linkedinProfile[0]
  const dedupeUrl = new Set<string>()
  const tweetsUnique = tw.filter((t) => {
    if (dedupeUrl.has(t.url)) return false
    dedupeUrl.add(t.url)
    return true
  })

  const identityLinks = [
    ig?.username && { platform: 'Instagram', value: `@${ig.username}` },
    tweetsUnique[0] && {
      platform: 'X (Twitter)',
      value: `@${tweetsUnique[0]['author.userName']}`,
    },
    liProfile?.url && {
      platform: 'LinkedIn',
      value: liProfile.url.replace(/^https?:\/\//, ''),
    },
  ].filter(Boolean) as { platform: string; value: string }[]

  const liFeedSorted = [...linkedinAuthoredPosts].sort((a, b) => {
    const ta = a.postedAtTimestamp ?? (a.postedAtISO ? new Date(a.postedAtISO).getTime() : 0)
    const tb = b.postedAtTimestamp ?? (b.postedAtISO ? new Date(b.postedAtISO).getTime() : 0)
    return tb - ta
  })

  const caseRef = `OSG-${String((targetName ?? 'SUBJECT').length).padStart(2, '0')}-${(ig?.username ?? 'X').slice(0, 4).toUpperCase()}`

  return (
    <section
      className="intel-section section"
      id="intelligence-dashboard"
      aria-labelledby="intel-heading"
    >
      <div className="intel-section__inner">
        <header className="intel-hero">
          <div className="intel-hero__meta">
            <p className="intel-hero__live">
              <span className="intel-hero__live-dot" aria-hidden="true" />
              Corpus ingest
            </p>
            <p className="intel-hero__ref" aria-label={`Case reference ${caseRef}`}>
              {caseRef}
            </p>
          </div>

          <h2 id="intel-heading" className="intel-hero__title">
            Multi-source intelligence
          </h2>

          <p className="intel-hero__lead">
            {dataSource === 'dummy' ? (
              <>
                Cross-indexed from <code className="intel-code">public/dummy_data/</code> — Instagram,
                X, LinkedIn profile + activity: skills, employers, post cadence, reactors, and comments —
                used to illustrate how public social data becomes a vulnerability map.
              </>
            ) : (
              <>
                Cross-indexed from your live Apify collection — public Instagram, X, and LinkedIn exports.
                Together they reveal identity linkage, oversharing, and signals an attacker could use for
                targeted social engineering.
              </>
            )}
          </p>

          <p className="intel-hero__axes">
            <span>Temporal</span>
            <span className="intel-hero__axes-sep" aria-hidden="true">
              /
            </span>
            <span>Geospatial</span>
            <span className="intel-hero__axes-sep" aria-hidden="true">
              /
            </span>
            <span className="intel-hero__axes-strong">Identity linkage</span>
          </p>
        </header>

        {loading && <IntelSkeleton />}

        {error && (
          <p className="intel-status intel-status--error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <motion.div
            className="intel-body"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
          >
            {targetName && (
              <motion.div variants={itemVariants} className="intel-entity">
                <p className="intel-entity__label">Resolved entity</p>
                <p className="intel-entity__name">{targetName}</p>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="intel-manifest" aria-label="Surface metrics">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={`intel-manifest__row intel-manifest__row--${s.tone ?? 'neutral'}`}
                >
                  <span className="intel-manifest__k">{s.label}</span>
                  <span className="intel-manifest__leader" aria-hidden="true" />
                  <span className="intel-manifest__v">{s.value}</span>
                  <p className="intel-manifest__note">{s.hint}</p>
                </div>
              ))}
            </motion.div>

            {privacyAnalytics && (
              <>
                <motion.div variants={itemVariants} className="intel-dq-strip" aria-label="Data quality">
                  <h3 className="intel-block-label">Dataset provenance</h3>
                  <ul className="intel-dq-strip__list">
                    {privacyAnalytics.dataQuality.map((row) => (
                      <li
                        key={`${row.label}-${row.value.slice(0, 24)}`}
                        className={`intel-dq-strip__row${row.warn ? ' intel-dq-strip__row--warn' : ''}`}
                      >
                        <span className="intel-dq-strip__k">{row.label}</span>
                        <span className="intel-dq-strip__v">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div variants={itemVariants} className="intel-exposure-grid">
                  <div className="intel-exposure-card">
                    <h3 className="intel-block-label">Exposure rubric</h3>
                    <p className="intel-block-lead intel-block-lead--tight">
                      Deterministic 0–100 index from public surface cues (platforms, geo tags, URLs, volume,
                      cross-channel keywords, contact-like patterns). Treat as how much structured public
                      material exists — not likelihood of breach.
                    </p>
                    <div className="intel-exposure-score">
                      <span className="intel-exposure-score__n">{privacyAnalytics.rubric.score}</span>
                      <span className="intel-exposure-score__lbl">exposure index</span>
                    </div>
                    {privacyAnalytics.rubric.factors.length === 0 ? (
                      <p className="intel-empty-hint">No scoring factors — sparse corpus.</p>
                    ) : (
                      <ul className="intel-exposure-factors">
                        {privacyAnalytics.rubric.factors.map((f) => (
                          <li key={`${f.label}-${f.detail}`} className="intel-exposure-factors__row">
                            <span className="intel-exposure-factors__pts">+{f.points}</span>
                            <div>
                              <span className="intel-exposure-factors__label">{f.label}</span>
                              <p className="intel-exposure-factors__detail">{f.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="intel-pii-card">
                    <h3 className="intel-block-label">Contact-pattern scan</h3>
                    <p className="intel-block-lead intel-block-lead--tight">
                      Heuristic counts on merged bios and posts — validate manually; high false-positive rate
                      on phone-like matches.
                    </p>
                    <ul className="intel-pii-stats">
                      <li>
                        <span className="intel-pii-stats__k">Email-like</span>
                        <span className="intel-pii-stats__v">{privacyAnalytics.pii.emailHits}</span>
                      </li>
                      <li>
                        <span className="intel-pii-stats__k">Phone-like</span>
                        <span className="intel-pii-stats__v">{privacyAnalytics.pii.phoneHits}</span>
                      </li>
                      <li>
                        <span className="intel-pii-stats__k">DM / contact invites</span>
                        <span className="intel-pii-stats__v">{privacyAnalytics.pii.dmInviteMentions}</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants} className="intel-thread-wrap">
              <h3 className="intel-block-label">Identity thread</h3>
              <p className="intel-block-lead">
                Same person across namespaces — trivial pivot once filenames are joined.
              </p>
              {privacyAnalytics && (
                <div className="intel-linkage-banner">
                  <span
                    className={`intel-linkage-badge intel-linkage-badge--${privacyAnalytics.identityLinkage.nameAlignment}`}
                  >
                    {privacyAnalytics.identityLinkage.nameAlignment}
                  </span>
                  <p className="intel-linkage-note">{privacyAnalytics.identityLinkage.note}</p>
                  {privacyAnalytics.identityLinkage.crossPlatformUrls.length > 0 && (
                    <ul className="intel-linkage-urls">
                      {privacyAnalytics.identityLinkage.crossPlatformUrls.map((x) => (
                        <li key={x.url}>
                          <span className="intel-linkage-urls__hint">{x.hint}</span>
                          <a href={x.url.startsWith('http') ? x.url : `https://${x.url}`} target="_blank" rel="noopener noreferrer">
                            {x.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <ol className="intel-thread" role="list">
                {identityLinks.map((row) => (
                  <li key={row.platform} className="intel-thread__item">
                    <span className="intel-thread__stem" aria-hidden="true" />
                    <div className="intel-thread__content">
                      <span className="intel-thread__plat">{row.platform}</span>
                      <span className="intel-thread__handle">{row.value}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>

            {privacyAnalytics && (
              <>
                <div className="intel-analysis-grid">
                  <motion.article variants={itemVariants} className="intel-analysis intel-analysis--primary">
                    <header className="intel-analysis__head">
                      <span className="intel-analysis__code">11</span>
                      <div>
                        <h3 className="intel-analysis__title">Posting rhythm (UTC)</h3>
                        <p className="intel-analysis__sub">
                          Hour-of-day buckets for X posts, authored LinkedIn posts, and Instagram captions in
                          this export — rough activity windows, not proof of timezone.
                        </p>
                      </div>
                    </header>
                    <div className="intel-analysis__plot">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={privacyAnalytics.hourly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 6" />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: 'var(--text-dim)', fontSize: 9, fontFamily: 'var(--mono)' }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border-mid)' }}
                            interval={3}
                          />
                          <YAxis
                            tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                            tickLine={false}
                            axisLine={false}
                            width={32}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="count"
                            name="Items"
                            fill="var(--teal)"
                            radius={[2, 2, 0, 0]}
                            maxBarSize={14}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.article>

                  <motion.article variants={itemVariants} className="intel-analysis intel-analysis--secondary">
                    <header className="intel-analysis__head">
                      <span className="intel-analysis__code">12</span>
                      <div>
                        <h3 className="intel-analysis__title">LinkedIn — reactor concentration</h3>
                        <p className="intel-analysis__sub">
                          Who reacts most on authored posts; high top-5 share implies a tight engagement
                          cluster.
                        </p>
                      </div>
                    </header>
                    <div className="intel-analysis__plot intel-analysis__plot--compact">
                      {privacyAnalytics.reactors.totalReactions === 0 ? (
                        <p className="intel-empty-hint">No per-reaction records in export.</p>
                      ) : (
                        <>
                          <p className="intel-reactor-summary">
                            <strong>{privacyAnalytics.reactors.totalReactions}</strong> reaction rows ·{' '}
                            <strong>{privacyAnalytics.reactors.uniqueReactorsApprox}</strong> unique reactor ids
                            (where ids exist) · top 5 share{' '}
                            <strong>
                              {privacyAnalytics.reactors.top5SharePct != null
                                ? `${privacyAnalytics.reactors.top5SharePct}%`
                                : '—'}
                            </strong>
                          </p>
                          <ul className="intel-reactor-list">
                            {privacyAnalytics.reactors.topReactors.map((r) => (
                              <li key={r.label} className="intel-reactor-list__row">
                                <span className="intel-reactor-list__label">{r.label}</span>
                                <span className="intel-reactor-list__n">{r.count}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </motion.article>
                </div>

                <motion.article variants={itemVariants} className="intel-analysis intel-analysis--full">
                  <header className="intel-analysis__head">
                    <span className="intel-analysis__code">13</span>
                    <div>
                      <h3 className="intel-analysis__title">Topic overlap across channels</h3>
                      <p className="intel-analysis__sub">
                        Token frequency on authored LinkedIn text, deduped X, and Instagram captions; cross-channel
                        terms support attribution and pretext planning.
                      </p>
                    </div>
                  </header>
                  <div className="intel-topic-grid">
                    <div className="intel-topic-col">
                      <h4 className="intel-topic-col__h">LinkedIn</h4>
                      {privacyAnalytics.topicOverlap.linkedin.length === 0 ? (
                        <p className="intel-empty-hint">No tokens.</p>
                      ) : (
                        <ul className="intel-topic-list">
                          {privacyAnalytics.topicOverlap.linkedin.map((x) => (
                            <li key={x.word}>
                              <span>{x.word}</span> <span className="intel-topic-list__n">{x.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="intel-topic-col">
                      <h4 className="intel-topic-col__h">X</h4>
                      {privacyAnalytics.topicOverlap.twitter.length === 0 ? (
                        <p className="intel-empty-hint">No tokens.</p>
                      ) : (
                        <ul className="intel-topic-list">
                          {privacyAnalytics.topicOverlap.twitter.map((x) => (
                            <li key={x.word}>
                              <span>{x.word}</span> <span className="intel-topic-list__n">{x.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="intel-topic-col">
                      <h4 className="intel-topic-col__h">Instagram</h4>
                      {privacyAnalytics.topicOverlap.instagram.length === 0 ? (
                        <p className="intel-empty-hint">No tokens.</p>
                      ) : (
                        <ul className="intel-topic-list">
                          {privacyAnalytics.topicOverlap.instagram.map((x) => (
                            <li key={x.word}>
                              <span>{x.word}</span> <span className="intel-topic-list__n">{x.count}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="intel-topic-col intel-topic-col--wide">
                      <h4 className="intel-topic-col__h">Cross-channel terms</h4>
                      {privacyAnalytics.topicOverlap.crossChannel.length === 0 ? (
                        <p className="intel-empty-hint">No overlapping terms yet.</p>
                      ) : (
                        <ul className="intel-topic-cross">
                          {privacyAnalytics.topicOverlap.crossChannel.map((x) => (
                            <li key={x.word}>
                              <span className="intel-topic-cross__w">{x.word}</span>
                              <span className="intel-topic-cross__ch">{x.channels}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.article>

                <motion.article variants={itemVariants} className="intel-analysis intel-analysis--full">
                  <header className="intel-analysis__head">
                    <span className="intel-analysis__code">14</span>
                    <div>
                      <h3 className="intel-analysis__title">URL / link surface</h3>
                      <p className="intel-analysis__sub">
                        Distinct URLs from Instagram bio, X posts, and authored LinkedIn posts (capped).
                      </p>
                    </div>
                  </header>
                  {privacyAnalytics.linkSurface.length === 0 ? (
                    <p className="intel-empty-hint">No http(s) links detected in this scrape.</p>
                  ) : (
                    <div className="intel-link-table-wrap">
                      <table className="intel-link-table">
                        <thead>
                          <tr>
                            <th scope="col">Host</th>
                            <th scope="col">Source</th>
                            <th scope="col">URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {privacyAnalytics.linkSurface.map((row) => (
                            <tr key={`${row.url}-${row.source}`}>
                              <td>{row.host}</td>
                              <td>{row.source}</td>
                              <td>
                                <a href={row.url} target="_blank" rel="noopener noreferrer" className="intel-link-table__a">
                                  {row.url.length > 72 ? `${row.url.slice(0, 72)}…` : row.url}
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.article>
              </>
            )}

            <div className="intel-analysis-grid">
              <motion.article variants={itemVariants} className="intel-analysis intel-analysis--primary">
                <header className="intel-analysis__head">
                  <span className="intel-analysis__code">01</span>
                  <div>
                    <h3 className="intel-analysis__title">X — cadence and reach</h3>
                    <p className="intel-analysis__sub">Monthly posts vs. summed impressions (deduped export).</p>
                  </div>
                </header>
                <div className="intel-analysis__plot">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={twitterByMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-mid)' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                        tickLine={false}
                        axisLine={false}
                        width={42}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="tweets"
                        name="Tweets"
                        stroke="var(--intel-x)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="views"
                        name="Views"
                        stroke="var(--teal)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.article>

              <motion.article variants={itemVariants} className="intel-analysis intel-analysis--secondary">
                <header className="intel-analysis__head">
                  <span className="intel-analysis__code">02</span>
                  <div>
                    <h3 className="intel-analysis__title">Instagram — media types</h3>
                    <p className="intel-analysis__sub">Composition of recent posts in the scrape.</p>
                  </div>
                </header>
                <div className="intel-analysis__plot intel-analysis__plot--compact">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={mediaMix}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={86}
                        paddingAngle={2}
                        stroke="var(--bg)"
                        strokeWidth={1}
                      >
                        {mediaMix.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                        formatter={(value) => <span className="intel-legend-label">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.article>
            </div>

            <motion.article variants={itemVariants} className="intel-analysis intel-analysis--full">
              <header className="intel-analysis__head">
                <span className="intel-analysis__code">03</span>
                <div>
                  <h3 className="intel-analysis__title">LinkedIn — skill surface</h3>
                  <p className="intel-analysis__sub">
                    Declared stack from profile JSON — fuels recruiter-themed pretexting and tech-stack lures.
                  </p>
                </div>
              </header>
              <div className="intel-analysis__plot">
                {skills.length === 0 ? (
                  <p className="intel-empty-hint">No skills array in profile export.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(180, skills.length * 36)}>
                    <BarChart
                      data={skills}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 6" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="skill"
                        width={148}
                        tick={{ fill: 'var(--text-h)', fontSize: 11, fontFamily: 'var(--mono)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="weight"
                        name="Rank weight"
                        fill="var(--intel-li)"
                        radius={[0, 2, 2, 0]}
                        maxBarSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.article>

            {linkedinAuthoredPosts.length > 0 && (
              <motion.div variants={itemVariants} className="intel-li-kpis" aria-label="LinkedIn engagement totals">
                <div className="intel-li-kpis__item">
                  <span className="intel-li-kpis__v">{linkedinEngagement.posts}</span>
                  <span className="intel-li-kpis__k">Authored posts</span>
                </div>
                <div className="intel-li-kpis__item">
                  <span className="intel-li-kpis__v">{linkedinEngagement.reactionRecords}</span>
                  <span className="intel-li-kpis__k">Reaction rows</span>
                </div>
                <div className="intel-li-kpis__item">
                  <span className="intel-li-kpis__v">{linkedinEngagement.comments}</span>
                  <span className="intel-li-kpis__k">Comments</span>
                </div>
                <div className="intel-li-kpis__item">
                  <span className="intel-li-kpis__v">{linkedinEngagement.shares}</span>
                  <span className="intel-li-kpis__k">Shares</span>
                </div>
                <div className="intel-li-kpis__item intel-li-kpis__item--warn">
                  <span className="intel-li-kpis__v">{linkedinEngagement.uniqueReactors}</span>
                  <span className="intel-li-kpis__k">Unique reactors</span>
                </div>
              </motion.div>
            )}

            <div className="intel-analysis-grid">
              <motion.article variants={itemVariants} className="intel-analysis intel-analysis--primary">
                <header className="intel-analysis__head">
                  <span className="intel-analysis__code">04</span>
                  <div>
                    <h3 className="intel-analysis__title">LinkedIn — post cadence</h3>
                    <p className="intel-analysis__sub">
                      Monthly authored activity; reactions use reaction list when present, else like counts.
                    </p>
                  </div>
                </header>
                <div className="intel-analysis__plot">
                  {linkedinByMonth.length === 0 ? (
                    <p className="intel-empty-hint">No dated posts in export.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={linkedinByMonth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 6" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--border-mid)' }}
                        />
                        <YAxis
                          tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--mono)' }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                          formatter={(value) => <span className="intel-legend-label">{value}</span>}
                        />
                        <Bar dataKey="posts" name="Posts" fill="var(--intel-li)" radius={[2, 2, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="reactions" name="Reactions" fill="var(--teal)" radius={[2, 2, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="comments" name="Comments" fill="var(--intel-x)" radius={[2, 2, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>

              <motion.article variants={itemVariants} className="intel-analysis intel-analysis--secondary">
                <header className="intel-analysis__head">
                  <span className="intel-analysis__code">05</span>
                  <div>
                    <h3 className="intel-analysis__title">LinkedIn — reaction mix</h3>
                    <p className="intel-analysis__sub">Aggregated reaction types across authored posts.</p>
                  </div>
                </header>
                <div className="intel-analysis__plot intel-analysis__plot--compact">
                  {linkedinReactionMix.length === 0 ? (
                    <p className="intel-empty-hint">No reactions in export.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={linkedinReactionMix}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={82}
                          paddingAngle={2}
                          stroke="var(--bg)"
                          strokeWidth={1}
                        >
                          {linkedinReactionMix.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 10, fontFamily: 'var(--mono)' }}
                          formatter={(value) => <span className="intel-legend-label">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.article>
            </div>

            {(linkedinCareer.length > 0 ||
              (liProfile?.educations?.length ?? 0) > 0 ||
              (liProfile?.certifications?.length ?? 0) > 0) && (
              <motion.div variants={itemVariants} className="intel-corpus">
                <header className="intel-analysis__head intel-analysis__head--inline">
                  <span className="intel-analysis__code">06</span>
                  <div>
                    <h3 className="intel-analysis__title">Professional corpus</h3>
                    <p className="intel-analysis__sub">
                      Structured from LinkedIn profile JSON — timeline, education, credentials.
                    </p>
                  </div>
                </header>
                <div className="intel-corpus__grid">
                  {linkedinCareer.length > 0 && (
                    <div className="intel-corpus__col">
                      <h4 className="intel-corpus__h">Experience</h4>
                      <ul className="intel-career">
                        {linkedinCareer.map((row, i) => (
                          <li key={`${row.company}-${i}`} className="intel-career__row">
                            <div className="intel-career__main">
                              <span className="intel-career__title">{row.title}</span>
                              <span className="intel-career__co">{row.company}</span>
                            </div>
                            {row.location && (
                              <span className="intel-career__loc">{row.location}</span>
                            )}
                            <span className="intel-career__range">{row.range}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="intel-corpus__col">
                    {liProfile?.educations && liProfile.educations.length > 0 && (
                      <>
                        <h4 className="intel-corpus__h">Education</h4>
                        <ul className="intel-edu">
                          {liProfile.educations.map((ed, i) => (
                            <li key={`${ed.schoolName}-${i}`} className="intel-edu__row">
                              <span className="intel-edu__school">{ed.schoolName}</span>
                              <span className="intel-edu__deg">
                                {[ed.degreeName, ed.fieldOfStudy].filter(Boolean).join(' · ')}
                              </span>
                              <span className="intel-edu__range">
                                {ed.startYear != null && ed.endYear != null
                                  ? `${ed.startYear} – ${ed.endYear}`
                                  : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {liProfile?.certifications && liProfile.certifications.length > 0 && (
                      <>
                        <h4 className="intel-corpus__h intel-corpus__h--spaced">Certifications</h4>
                        <ul className="intel-cert">
                          {liProfile.certifications.map((c, i) => (
                            <li key={`${c.name}-${i}`} className="intel-cert__row">
                              <span className="intel-cert__name">{c.name}</span>
                              <span className="intel-cert__auth">{c.authority}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {linkedinHashtags.length > 0 && (
              <motion.div variants={itemVariants} className="intel-hashtags-block">
                <header className="intel-analysis__head intel-analysis__head--inline">
                  <span className="intel-analysis__code">07</span>
                  <div>
                    <h3 className="intel-analysis__title">Narrative tags</h3>
                    <p className="intel-analysis__sub">
                      Hashtags in authored LinkedIn text — themes for monitoring and impersonation prep.
                    </p>
                  </div>
                </header>
                <ul className="intel-hashtags" aria-label="Top hashtags">
                  {linkedinHashtags.map((h) => (
                    <li key={h.tag} className="intel-hashtags__pill">
                      #{h.tag}
                      <span className="intel-hashtags__n">{h.count}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            <div className="intel-map-split">
              <motion.div variants={itemVariants} className="intel-map-col">
                <header className="intel-analysis__head intel-analysis__head--inline">
                  <span className="intel-analysis__code">08</span>
                  <div>
                    <h3 className="intel-analysis__title">Geospatial correlation</h3>
                    <p className="intel-analysis__sub">
                      IG check-ins, LinkedIn declared location, roles, and school → demo geocode.
                    </p>
                  </div>
                </header>
                <p className="intel-map-disclaimer" role="note">
                  Map pins are derived from public location labels and approximate forward-geocoding — not live
                  GPS or verified visits. Use for pattern sense only.
                </p>
                <div className="intel-map-wrap">
                  <LocationIntelMap markers={mapMarkers} />
                </div>
              </motion.div>

              <motion.aside variants={itemVariants} className="intel-waypoints">
                <h4 className="intel-waypoints__label">Waypoint index</h4>
                <p className="intel-waypoints__disclaimer">
                  Labels mirror source fields; accuracy depends on profile text and geocoder fuzziness.
                </p>
                <ul className="intel-waypoints__list">
                  {mapMarkers.map((m) => (
                    <li key={m.id} className="intel-waypoints__item">
                      <span className="intel-waypoints__mark" aria-hidden="true" />
                      <div>
                        <span className="intel-waypoints__place">{m.label}</span>
                        <span className="intel-waypoints__src">{m.source}</span>
                        <p className="intel-waypoints__detail">{m.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.aside>
            </div>

            <motion.div variants={itemVariants} className="intel-chatter intel-chatter--solo">
              <header className="intel-analysis__head intel-analysis__head--inline">
                <span className="intel-analysis__code">09</span>
                <div>
                  <h3 className="intel-analysis__title">Chatter log — X</h3>
                  <p className="intel-analysis__sub">Deduped lines, newest first.</p>
                </div>
              </header>
              <ul className="intel-chatter__log">
                {tweetsUnique.slice(0, 8).map((t) => (
                  <li key={t.url} className="intel-chatter__row">
                    <time className="intel-chatter__time" dateTime={t.createdAt}>
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                    <div className="intel-chatter__body">
                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="intel-chatter__text">
                        {t.text.length > 220 ? `${t.text.slice(0, 220)}…` : t.text}
                      </a>
                      <p className="intel-chatter__stats">
                        {(t.viewCount ?? 0).toLocaleString()} views · {t.likeCount} likes
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {liFeedSorted.length > 0 && (
              <motion.div variants={itemVariants} className="intel-chatter intel-chatter--linkedin">
                <header className="intel-analysis__head intel-analysis__head--inline">
                  <span className="intel-analysis__code">10</span>
                  <div>
                    <h3 className="intel-analysis__title">Activity extract — LinkedIn</h3>
                    <p className="intel-analysis__sub">
                      Authored posts with engagement counts; full reactor lists are in raw JSON.
                    </p>
                  </div>
                </header>
                <ul className="intel-chatter__log">
                  {liFeedSorted.slice(0, 8).map((p) => {
                    const when = p.postedAtISO
                      ? new Date(p.postedAtISO).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : p.timeSincePosted ?? '—'
                    const rc = p.reactions?.length ?? 0
                    const likes = p.numLikes ?? 0
                    const reactLabel = rc > 0 ? `${rc} reactions` : likes > 0 ? `${likes} likes` : '—'
                    return (
                      <li key={p.urn ?? p.url ?? p.text?.slice(0, 40)} className="intel-chatter__row">
                        <time className="intel-chatter__time" dateTime={p.postedAtISO}>
                          {when}
                        </time>
                        <div className="intel-chatter__body">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="intel-chatter__text"
                            >
                              {(p.text ?? '').length > 240 ? `${(p.text ?? '').slice(0, 240)}…` : p.text ?? '—'}
                            </a>
                          ) : (
                            <span className="intel-chatter__text">
                              {(p.text ?? '').length > 240 ? `${(p.text ?? '').slice(0, 240)}…` : p.text ?? '—'}
                            </span>
                          )}
                          <p className="intel-chatter__stats">
                            {reactLabel}
                            {p.numComments != null && p.numComments > 0
                              ? ` · ${p.numComments} comments`
                              : p.comments?.length
                                ? ` · ${p.comments.length} comments`
                                : ''}
                            {p.shareAudience && (
                              <span className="intel-chatter__audience"> · {p.shareAudience}</span>
                            )}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
