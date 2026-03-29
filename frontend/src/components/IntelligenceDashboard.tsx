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
    targetName,
    stats,
    twitterByMonth,
    mediaMix,
    skills,
    mapMarkers,
  } = useDatasets()

  const ig = data?.instagram[0]
  const tw = data?.twitter ?? []
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
    data?.linkedin[0] && {
      platform: 'LinkedIn',
      value: data.linkedin[0].basic_info.profile_url.replace('https://', ''),
    },
  ].filter(Boolean) as { platform: string; value: string }[]

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
            Cross-indexed from <code className="intel-code">public/dummy_data/</code> — handles,
            cadence, geography, and professional graph without treating each platform in isolation.
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

            <motion.div variants={itemVariants} className="intel-thread-wrap">
              <h3 className="intel-block-label">Identity thread</h3>
              <p className="intel-block-lead">
                Same person across namespaces — trivial pivot once filenames are joined.
              </p>
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
                  <h3 className="intel-analysis__title">LinkedIn — public skill ordering</h3>
                  <p className="intel-analysis__sub">
                    Ordered signals — useful for recruiter OSINT and stack-specific lures.
                  </p>
                </div>
              </header>
              <div className="intel-analysis__plot">
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
                      width={132}
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
              </div>
            </motion.article>

            <div className="intel-map-split">
              <motion.div variants={itemVariants} className="intel-map-col">
                <header className="intel-analysis__head intel-analysis__head--inline">
                  <span className="intel-analysis__code">04</span>
                  <div>
                    <h3 className="intel-analysis__title">Geospatial correlation</h3>
                    <p className="intel-analysis__sub">
                      Check-ins and declared locations → approximate pins (demo geocode).
                    </p>
                  </div>
                </header>
                <div className="intel-map-wrap">
                  <LocationIntelMap markers={mapMarkers} />
                </div>
              </motion.div>

              <motion.aside variants={itemVariants} className="intel-waypoints">
                <h4 className="intel-waypoints__label">Waypoint index</h4>
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
                <span className="intel-analysis__code">05</span>
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
                        {t.viewCount.toLocaleString()} views · {t.likeCount} likes
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
