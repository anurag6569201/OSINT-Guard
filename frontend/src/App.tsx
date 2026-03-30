import { motion, useScroll, useTransform } from 'framer-motion'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
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

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

function Nav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85])
  const location = useLocation()
  const onLanding = location.pathname === '/'

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
          <Link
            to="/"
            className="nav__brand-btn"
            aria-label="Back to landing — new scan"
          >
            <div className="nav__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="nav__name">OSINT-Guard</span>
          </Link>
        )}
      </div>

      <div className="nav__right">
        {!onLanding && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/" className="nav__new-scan">
              New scan
            </Link>
          </motion.div>
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

function AnalysisRoute() {
  const { canSubmit } = useScanFlow()
  if (!canSubmit) {
    return <Navigate to="/" replace />
  }
  return <AnalysisView />
}

function AppLayout() {
  return (
    <div className="app">
      <Nav />
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <DatasetProvider>
        <ScanFlowProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="analysis" element={<AnalysisRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ScanFlowProvider>
      </DatasetProvider>
    </BrowserRouter>
  )
}

export default App
