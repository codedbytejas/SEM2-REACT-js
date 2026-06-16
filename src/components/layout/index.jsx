import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../../store/useAppStore'
import { Button, Modal, Input, Badge, T } from '../ui'

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
export const Icons = {
  Dashboard:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Matrix:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>,
  Arbitrage:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Loop:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>,
  Simulator:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Graph:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Analytics:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Units:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Settings:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Plus:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  Zap:        () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Hexagon:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7"/></svg>,
  ArrowRight: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/></svg>,
  Target:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  Alert:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 3 22 20 2 20Z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17.5" x2="12.01" y2="17.5"/></svg>,
  Percent:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  Play:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20"/></svg>,
  Check:      () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Empty:      () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="11" cy="11" r="7"/><line x1="20.5" y1="20.5" x2="16.5" y2="16.5"/></svg>,
}

const NAV_GROUPS = [
  { title: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', Icon: Icons.Dashboard },
    { id: 'analytics', label: 'Analytics', Icon: Icons.Analytics },
  ]},
  { title: 'Engine', items: [
    { id: 'matrix',    label: 'Exchange Matrix',  Icon: Icons.Matrix    },
    { id: 'arbitrage', label: 'Arbitrage Engine', Icon: Icons.Arbitrage },
    { id: 'loop',      label: 'Loop Visualizer',  Icon: Icons.Loop      },
    { id: 'simulator', label: 'Simulator',        Icon: Icons.Simulator },
    { id: 'graph',     label: 'Graph Explorer',   Icon: Icons.Graph     },
  ]},
  { title: 'Workspace', items: [
    { id: 'units',    label: 'Custom Units', Icon: Icons.Units    },
    { id: 'settings', label: 'Settings',     Icon: Icons.Settings },
  ]},
]

const NAV_GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'

// ─── A single nav row with sliding gradient active pill ───────────────────────
function NavRow({ id, label, Icon, active, badge, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={active ? {} : { backgroundColor: 'rgba(15,23,42,0.05)' }}
      whileTap={{ scale: 0.985 }}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 11,
        padding: '8px 10px', borderRadius: 11, cursor: 'pointer',
        backgroundColor: 'rgba(0,0,0,0)',
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-active-pill"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          style={{ position: 'absolute', inset: 0, borderRadius: 11, background: NAV_GRADIENT, boxShadow: '0 8px 20px rgba(79,70,229,0.35)' }}
        />
      )}
      <div style={{
        position: 'relative', zIndex: 1, width: 30, height: 30, flexShrink: 0, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.05)',
        color: active ? '#fff' : T.muted, transition: 'background 0.18s, color 0.18s',
      }}>
        <Icon />
      </div>
      <span style={{ position: 'relative', zIndex: 1, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : T.text }}>{label}</span>
      {badge > 0 && (
        <span style={{
          position: 'relative', zIndex: 1, marginLeft: 'auto',
          background: active ? 'rgba(255,255,255,0.25)' : T.profit, color: '#fff',
          borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono',
        }}>{badge}</span>
      )}
    </motion.div>
  )
}

// ─── Ticker Tape ──────────────────────────────────────────────────────────────
export function TickerTape() {
  const { units, rates } = useAppStore()
  const items = useMemo(() => {
    const ticks = []
    for (const from of units.slice(0, 5))
      for (const to of units.slice(0, 5))
        if (from !== to && rates[from]?.[to])
          ticks.push({ from, to, rate: rates[from][to] })
    return ticks.slice(0, 16)
  }, [units, rates])

  if (items.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', background: T.card, borderBottom: `1px solid ${T.border}`, height: 28, flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', flexShrink: 0,
        background: NAV_GRADIENT, color: '#fff',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse-glow-green 2s infinite' }} />
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em' }}>LIVE RATES</span>
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'inline-flex', gap: 36, animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap', paddingTop: 6, paddingLeft: '100%' }}>
          {[...items, ...items].map((t, i) => (
            <span key={i} style={{ fontSize: 10, color: T.muted, fontFamily: 'JetBrains Mono' }}>
              <span style={{ color: T.text, fontWeight: 600 }}>{t.from}/{t.to}</span>
              {' '}
              <span style={{ color: T.profit }}>{t.rate.toFixed(5)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ opportunities }) {
  const { activePage, setPage } = useAppStore()

  return (
    <div style={{
      width: 248, background: T.card, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', padding: '18px 14px 16px',
      flexShrink: 0, height: '100vh', overflowY: 'auto', position: 'sticky', top: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 6px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: NAV_GRADIENT, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 18px rgba(79,70,229,0.35)',
        }}>
          <Icons.Zap />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: T.text, lineHeight: 1 }}>ArbMatrix</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Arbitrage Explorer</div>
        </div>
      </div>

      {/* Nav groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.title}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 10px', marginBottom: 7, opacity: 0.7 }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {group.items.map(({ id, label, Icon }) => (
                <NavRow
                  key={id} id={id} label={label} Icon={Icon}
                  active={activePage === id}
                  badge={id === 'arbitrage' ? opportunities : 0}
                  onClick={() => setPage(id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer card */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div style={{
          borderRadius: 12, padding: '14px 14px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))',
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.profit }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: T.text, letterSpacing: '0.02em' }}>B.Tech CSE Case Study</span>
          </div>
          <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.7 }}>
            <div>Bellman-Ford Algorithm</div>
            <div>Negative Cycle Detection</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const { activePage, addUnit, unitMeta, notifications } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '', color: '#3B82F6', category: 'Custom', description: '' })

  const PAGE_TITLES = {
    dashboard: 'Dashboard', matrix: 'Exchange Matrix', arbitrage: 'Arbitrage Engine',
    loop: 'Loop Visualizer', simulator: 'Principal Compounder', graph: 'Graph Explorer',
    units: 'Custom Units', analytics: 'Analytics', settings: 'Settings',
  }

  const PAGE_SUBS = {
    dashboard: 'Overview of arbitrage activity',
    matrix: 'Edit conversion rates between units',
    arbitrage: 'Detected negative-cycle opportunities',
    loop: 'Step through a single arbitrage cycle',
    simulator: 'Compound a loop over your capital',
    graph: 'Explore the conversion graph',
    units: 'Manage units and quick-add presets',
    analytics: 'Charts and historical performance',
    settings: 'Preferences and workspace tools',
  }

  const handleAdd = () => {
    if (addUnit(form.name, { icon: form.icon, color: form.color, category: form.category, description: form.description })) {
      setShowAdd(false)
      setForm({ name: '', icon: '', color: '#3B82F6', category: 'Custom', description: '' })
    }
  }

  return (
    <>
      <div style={{
        height: 62, background: T.card, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ width: 4, height: 30, borderRadius: 3, background: NAV_GRADIENT, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{PAGE_TITLES[activePage]}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{PAGE_SUBS[activePage]}</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px',
        }}>
          <Icons.Search />
          <span style={{ fontSize: 12, color: T.muted }}>Search… (coming soon)</span>
        </div>

        <motion.button
          onClick={() => setShowAdd(true)}
          whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
            fontSize: 12.5, fontWeight: 600, color: '#fff', cursor: 'pointer', border: 'none',
            fontFamily: 'Inter', background: NAV_GRADIENT, boxShadow: '0 8px 18px rgba(79,70,235,0.30)',
          }}
        >
          <Icons.Plus /> Add Unit
        </motion.button>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button style={{
            background: T.surface, border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer',
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.Bell />
          </button>
          {notifications.length > 0 && (
            <div style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, background: T.loss, borderRadius: '50%', border: `2px solid ${T.card}` }} />
          )}
        </div>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 11,
          background: NAV_GRADIENT, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
          boxShadow: '0 6px 14px rgba(79,70,235,0.30)',
        }}>U</div>
      </div>

      {/* Add Unit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Unit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Unit Name (e.g. GOLD, ENERGY)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="USD, BTC, GOLD..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 10 }}>
            <Input label="Symbol" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="$, A…" />
            <div>
              <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Color</label>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                style={{ width: '100%', height: 38, padding: 2, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, cursor: 'pointer' }} />
            </div>
            <Input label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Fiat, Crypto..." />
          </div>
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />

          {/* Preview */}
          {form.name && (
            <div style={{ padding: '12px 16px', background: `${form.color}12`, border: `1px solid ${form.color}30`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{form.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.color }}>{form.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{form.category}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="primary" onClick={handleAdd} disabled={!form.name}>Create Unit</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
