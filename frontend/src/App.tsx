import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { InferenceTable } from './components/InferenceTable'
import { IntelligenceDashboard } from './components/IntelligenceDashboard'
import { LandingPage } from './components/LandingPage'
import { MethodologyFooter } from './components/MethodologyFooter'
import { PatternOfLifeTimeline } from './components/PatternOfLifeTimeline'
import { SpearPhishingSims } from './components/SpearPhishingSims'
import { DatasetProvider } from './context/DatasetProvider'
import { ScanFlowProvider, useScanFlow } from './context/ScanFlowContext'
import './App.css'

function Nav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85])
  const { phase, resetToLanding } = useScanFlow()
  const onLanding = phase === 'landing'

  return (
    <motion.header className="nav" aria-label="Site navigation">
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg)',
          opacity: onLanding ? 0.92 : bgOpacity,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          borderBottomColor: onLanding
            ? 'var(--border)'
            : `rgba(128,128,128, ${borderOpacity})`,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      <div className="nav__brand">
        {onLanding ? (
          <div className="nav__brand-static">
            <div className="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="nav__name">OSINT-Guard</span>
          </div>
        ) : (
          <button
            type="button"
            className="nav__brand-btn"
            onClick={resetToLanding}
            aria-label="Back to landing — new scan"
          >
            <div className="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="nav__name">OSINT-Guard</span>
          </button>
        )}
      </div>

      <div className="nav__right">
        {!onLanding && (
          <motion.button
            type="button"
            className="nav__new-scan"
            onClick={resetToLanding}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            New scan
          </motion.button>
        )}
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

function AnalysisView() {
  return (
    <motion.div
      className="app__analysis"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <main>
        <ExecutiveSummary />
        <IntelligenceDashboard />
        <PatternOfLifeTimeline />
        <InferenceTable />
        <SpearPhishingSims />
        <MethodologyFooter />
      </main>
    </motion.div>
  )
}

function AppShell() {
  const { phase } = useScanFlow()

  return (
    <div className="app">
      <Nav />
      <AnimatePresence mode="wait">
        {phase === 'landing' ? (
          <LandingPage key="landing" />
        ) : (
          <AnalysisView key="analysis" />
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  return (
    <DatasetProvider>
      <ScanFlowProvider>
        <AppShell />
      </ScanFlowProvider>
    </DatasetProvider>
  )
}

export default App
