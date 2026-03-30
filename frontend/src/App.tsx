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
import { AnalysisCollectError } from './components/AnalysisCollectError'
import { AnalysisPipelineLoader } from './components/AnalysisPipelineLoader'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { InferenceTable } from './components/InferenceTable'
import { IntelligenceDashboard } from './components/IntelligenceDashboard'
import { LandingPage } from './components/LandingPage'
import { MethodologyFooter } from './components/MethodologyFooter'
import { PatternOfLifeTimeline } from './components/PatternOfLifeTimeline'
import { SpearPhishingSims } from './components/SpearPhishingSims'
import { AiInsightsProvider } from './context/AiInsightsContext'
import { DatasetProvider } from './context/DatasetProvider'
import { ScanFlowProvider, useScanFlow } from './context/ScanFlowContext'
import { useAiInsights } from './context/AiInsightsContext'
import { useDatasets } from './context/useDatasets'
import './App.css'

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

const useDummyDataMode = () => import.meta.env.VITE_USE_DUMMY_DATA === 'true'

function CollectWarnings() {
  const { collectErrors, dataSource } = useDatasets()
  if (dataSource !== 'live' || !collectErrors || !Object.keys(collectErrors).length) {
    return null
  }
  return (
    <div className="collect-warnings" role="status">
      <p className="collect-warnings__title">Some sources failed to load</p>
      <ul className="collect-warnings__list">
        {Object.entries(collectErrors).map(([k, msg]) => (
          <li key={k}>
            <strong>{k}</strong>: {msg}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Nav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85])
  const location = useLocation()
  const onLanding = location.pathname === '/'
  const demoDummy = useDummyDataMode()
  const { pipelineLoading, pipelineStage } = useAiInsights()

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
        {!onLanding && pipelineLoading ? (
          <span className="nav__tag nav__tag--busy" aria-live="polite">
            {pipelineStage === 'collect'
              ? 'Collecting public data…'
              : pipelineStage === 'analyze'
                ? 'AI privacy assessment…'
                : 'Loading report…'}
          </span>
        ) : (
          <span
            className="nav__tag"
            aria-label={demoDummy ? 'Demo with dummy data' : 'Live Apify collection'}
          >
            {demoDummy ? 'Demo · sandbox data' : 'Live · Apify + Gemini'}
          </span>
        )}
      </div>
    </motion.header>
  )
}

function AnalysisView() {
  const { loading: dsLoading, error, data, dataSource } = useDatasets()
  const { pipelineLoading, pipelineStage } = useAiInsights()

  const showLoader =
    (dataSource === 'dummy' && dsLoading) || pipelineLoading

  if (dataSource === 'live' && !dsLoading && error && !data) {
    return (
      <motion.div
        className="app__analysis"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <main>
          <AnalysisCollectError message={error} />
        </main>
      </motion.div>
    )
  }

  if (showLoader) {
    return (
      <motion.div
        className="app__analysis app__analysis--pipeline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <main>
          <AnalysisPipelineLoader stage={pipelineStage} dataSource={dataSource} />
        </main>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="app__analysis"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <main>
        <CollectWarnings />
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
      <ScanFlowProvider>
        <DatasetProvider>
          <AiInsightsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="analysis" element={<AnalysisRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AiInsightsProvider>
        </DatasetProvider>
      </ScanFlowProvider>
    </BrowserRouter>
  )
}

export default App
