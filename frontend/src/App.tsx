import { motion, useScroll, useTransform } from 'framer-motion'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { InferenceTable } from './components/InferenceTable'
import { IntelligenceDashboard } from './components/IntelligenceDashboard'
import { MethodologyFooter } from './components/MethodologyFooter'
import { PatternOfLifeTimeline } from './components/PatternOfLifeTimeline'
import { SpearPhishingSims } from './components/SpearPhishingSims'
import { DatasetProvider } from './context/DatasetProvider'
import './App.css'

function Nav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85])

  return (
    <motion.header className="nav" aria-label="Site navigation">
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg)',
          opacity: bgOpacity,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          borderBottomColor: `rgba(128,128,128, ${borderOpacity})`,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div className="nav__brand">
        <div className="nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <span className="nav__name">OSINT-Guard</span>
      </div>

      <div className="nav__right">
        <div className="nav__live" aria-label="Live sandbox active">
          <span className="nav__live-dot" aria-hidden="true" />
          Live sandbox
        </div>
        <span className="nav__tag" aria-label="Demo with dummy data">
          Demo · dummy data
        </span>
      </div>
    </motion.header>
  )
}

function App() {
  return (
    <DatasetProvider>
      <div className="app">
        <Nav />
        <main>
          <ExecutiveSummary />
          <IntelligenceDashboard />
          <PatternOfLifeTimeline />
          <InferenceTable />
          <SpearPhishingSims />
          <MethodologyFooter />
        </main>
      </div>
    </DatasetProvider>
  )
}

export default App
