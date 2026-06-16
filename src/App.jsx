import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useAppStore from './store/useAppStore'
import { computeArbitrageOpportunities } from './lib/algorithms'
import { Sidebar, Header, TickerTape } from './components/layout'
import { NotificationToast } from './components/ui'

import DashboardPage      from './pages/DashboardPage'
import MatrixPage         from './pages/MatrixPage'
import ArbitragePage      from './pages/ArbitragePage'
import LoopVisualizerPage from './pages/LoopVisualizerPage'
import SimulatorPage      from './pages/SimulatorPage'
import GraphExplorerPage  from './pages/GraphExplorerPage'
import CustomUnitsPage    from './pages/CustomUnitsPage'
import AnalyticsPage      from './pages/AnalyticsPage'
import SettingsPage       from './pages/SettingsPage'

const PAGE_MAP = {
  dashboard: DashboardPage, matrix: MatrixPage, arbitrage: ArbitragePage,
  loop: LoopVisualizerPage, simulator: SimulatorPage, graph: GraphExplorerPage,
  units: CustomUnitsPage, analytics: AnalyticsPage, settings: SettingsPage,
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

export default function App() {
  const { activePage, units, rates, fees, notifications, dismissNotification } = useAppStore()
  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  const PageComponent = PAGE_MAP[activePage] || DashboardPage

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#070B14' }}>
      <Sidebar opportunities={opportunities.length} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TickerTape />
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activePage} variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ minHeight: '100%' }}>
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  )
}
