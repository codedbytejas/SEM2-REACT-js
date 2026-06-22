/*
=================================================
FILE: src/App.jsx

Purpose:
Yeh top-level React component hai jo poore application ka layout define karta hai.

Is file mein:
1. Global store se state read karta hai (Zustand)
2. Algorithm se opportunities compute karta hai (useMemo ke saath)
3. Sidebar, Header, TickerTape aur active Page component ko render karta hai
4. Framer Motion se page transitions handle karta hai

Viva Explanation:
Examiner ko bol sakte ho ki yeh app ka coordinator hai — routing ka kaam nahi kar raha but `activePage` se page components switch karta hai. `useMemo` expensive computation ko avoid karne ke liye use hua hai.
React concepts: components, props, state (custom store), hooks (useMemo), composition, third-party libs (framer-motion)
=================================================
*/

// React hook
import { useMemo } from 'react'
// Animation helpers from framer-motion for smooth page transitions
import { AnimatePresence, motion } from 'framer-motion'
// Custom Zustand store hook for global app state
import useAppStore from './store/useAppStore'
// Core algorithm functions (Bellman-Ford based detection)
import { computeArbitrageOpportunities } from './lib/algorithms'
// Layout components
import { Sidebar, Header, TickerTape } from './components/layout'
// UI primitive for notifications
import { NotificationToast } from './components/ui'

// Page components (one per app view)
import DashboardPage      from './pages/DashboardPage'
import MatrixPage         from './pages/MatrixPage'
import ArbitragePage      from './pages/ArbitragePage'
import LoopVisualizerPage from './pages/LoopVisualizerPage'
import SimulatorPage      from './pages/SimulatorPage'
import GraphExplorerPage  from './pages/GraphExplorerPage'
import CustomUnitsPage    from './pages/CustomUnitsPage'
import AnalyticsPage      from './pages/AnalyticsPage'
import SettingsPage       from './pages/SettingsPage'

// Map of page keys (from store.activePage) to components
const PAGE_MAP = {
  dashboard: DashboardPage, matrix: MatrixPage, arbitrage: ArbitragePage,
  loop: LoopVisualizerPage, simulator: SimulatorPage, graph: GraphExplorerPage,
  units: CustomUnitsPage, analytics: AnalyticsPage, settings: SettingsPage,
}

// framer-motion variants for enter/exit animation of pages
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

export default function App() {
  // store se zaruri state aur actions le rahe hain
  // useAppStore ek custom hook hai jo Zustand ka store return karta hai
  const { activePage, units, rates, fees, notifications, dismissNotification } = useAppStore()

  // useMemo ka use kar rahe hain taaki heavy compute (arbitrage detection) sirf tab chale
  // jab inputs (units, rates, fees) change ho
  // Agar useMemo hata diya toh har render pe compute chalega aur performance gir sakti hai
  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])

  // PAGE_MAP se current page ka component select karte hain
  // agar activePage invalid hua toh default DashboardPage use karenge
  const PageComponent = PAGE_MAP[activePage] || DashboardPage

  return (
    // Main layout wrapper: sidebar + main column + notification toast
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F6FB' }}>
      {/* Sidebar ko opportunities count pass kar rahe hain (badge display) */}
      <Sidebar opportunities={opportunities.length} />

      {/* Main column: ticker, header, and page content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TickerTape />
        <Header />

        {/* Page content area with vertical scrolling */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* AnimatePresence ensures exit animations when switching pages */}
          <AnimatePresence mode="wait">
            <motion.div key={activePage} variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ minHeight: '100%' }}>
              {/* Render the active page component */}
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Notification toast listens to store.notifications and dismiss action */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  )
}
