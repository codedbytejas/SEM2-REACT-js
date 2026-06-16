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
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',     Icon: Icons.Dashboard  },
  { id: 'matrix',     label: 'Exchange Matrix',Icon: Icons.Matrix     },
  { id: 'arbitrage',  label: 'Arbitrage Engine',Icon: Icons.Arbitrage },
  { id: 'loop',       label: 'Loop Visualizer',Icon: Icons.Loop       },
  { id: 'simulator',  label: 'Simulator',      Icon: Icons.Simulator  },
  { id: 'graph',      label: 'Graph Explorer', Icon: Icons.Graph      },
  { id: 'units',      label: 'Custom Units',   Icon: Icons.Units      },
  { id: 'analytics',  label: 'Analytics',      Icon: Icons.Analytics  },
  { id: 'settings',   label: 'Settings',       Icon: Icons.Settings   },
]

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
    <div style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.35)', borderBottom: `1px solid ${T.border}`, height: 26, flexShrink: 0 }}>
      <div style={{ display: 'inline-flex', gap: 36, animation: 'ticker 28s linear infinite', whiteSpace: 'nowrap', paddingTop: 4, paddingLeft: '100%' }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} style={{ fontSize: 10, color: T.muted, fontFamily: 'JetBrains Mono' }}>
            <span style={{ color: T.text, fontWeight: 600 }}>{t.from}/{t.to}</span>
            {' '}
            <span style={{ color: T.profit }}>{t.rate.toFixed(5)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ opportunities }) {
  const { activePage, setPage } = useAppStore()

  return (
    <div style={{
      width: 224, background: T.surface, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', padding: '16px 10px 20px', gap: 2,
      flexShrink: 0, height: '100vh', overflowY: 'auto', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '6px 12px 22px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>
          <span style={{ color: T.accent }}>ARB</span>
          <span style={{ color: T.text }}>MATRIX</span>
        </div>
        <div style={{ fontSize: 9, color: T.muted, marginTop: 2, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Arbitrage Explorer</div>
        <div style={{ marginTop: 10, height: 1, background: `linear-gradient(90deg, ${T.accent}40, transparent)` }} />
      </div>

      {/* Nav */}
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = activePage === id
        return (
          <motion.div
            key={id}
            onClick={() => setPage(id)}
            whileHover={{ x: 2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.18s',
              color: active ? T.accent : T.muted,
              background: active ? `${T.accent}14` : 'transparent',
              border: active ? `1px solid ${T.accent}28` : '1px solid transparent',
              fontSize: 13, fontWeight: active ? 600 : 400,
            }}
          >
            <Icon />
            <span>{label}</span>
            {id === 'arbitrage' && opportunities > 0 && (
              <span style={{
                marginLeft: 'auto', background: T.profit, color: '#000',
                borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 800,
              }}>
                {opportunities}
              </span>
            )}
            {active && <motion.div layoutId="nav-indicator" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: T.accent }} />}
          </motion.div>
        )
      })}

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '14px 12px 0', borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: T.accent, marginBottom: 2 }}>B.Tech CSE Case Study</div>
          <div>Bellman-Ford Algorithm</div>
          <div>Negative Cycle Detection</div>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
export function Header() {
  const { activePage, addUnit, unitMeta, notifications } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '🔷', color: '#3B82F6', category: 'Custom', description: '' })

  const PAGE_TITLES = {
    dashboard: 'Dashboard', matrix: 'Exchange Matrix', arbitrage: 'Arbitrage Engine',
    loop: 'Loop Visualizer', simulator: 'Principal Compounder', graph: 'Graph Explorer',
    units: 'Custom Units', analytics: 'Analytics', settings: 'Settings',
  }

  const handleAdd = () => {
    if (addUnit(form.name, { icon: form.icon, color: form.color, category: form.category, description: form.description })) {
      setShowAdd(false)
      setForm({ name: '', icon: '🔷', color: '#3B82F6', category: 'Custom', description: '' })
    }
  }

  return (
    <>
      <div style={{
        height: 54, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14, flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{PAGE_TITLES[activePage]}</div>
        <div style={{ flex: 1 }} />

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px',
        }}>
          <Icons.Search />
          <span style={{ fontSize: 12, color: T.muted }}>Search... (coming soon)</span>
        </div>

        <Button variant="primary" onClick={() => setShowAdd(true)} size="sm">
          <Icons.Plus /> Add Unit
        </Button>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 6, display: 'flex' }}>
            <Icons.Bell />
          </button>
          {notifications.length > 0 && (
            <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: T.loss, borderRadius: '50%', border: `1.5px solid ${T.surface}` }} />
          )}
        </div>

        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
        }}>U</div>
      </div>

      {/* Add Unit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Unit">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Unit Name (e.g. GOLD, ENERGY)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="USD, BTC, GOLD..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 10 }}>
            <Input label="Icon / Emoji" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
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
