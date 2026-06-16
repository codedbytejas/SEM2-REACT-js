import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { Button, Card, Input, Divider, T } from '../components/ui'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }

function Section({ title, children }) {
  return (
    <motion.div variants={fadeUp}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>{title}</div>
        {children}
      </Card>
    </motion.div>
  )
}

function SettingRow({ label, sub, control }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{control}</div>
    </div>
  )
}

export default function SettingsPage() {
  const {
    precision, setPrecision,
    fees, setFees,
    simHistory, clearSimHistory,
    exportWorkspace, importWorkspace, resetWorkspace,
    units, rates, unitMeta,
    _notify,
  } = useAppStore()

  const fileRef  = useRef()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        importWorkspace(data)
      } catch {
        _notify({ type: 'loss', message: 'Invalid JSON file' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const storageSize = useMemo_(() => {
    try {
      const raw = localStorage.getItem('arbmatrix-v3') || ''
      return (new Blob([raw]).size / 1024).toFixed(1)
    } catch { return '?' }
  })

  const stats = {
    units:   units.length,
    rates:   Object.values(rates).flatMap(Object.values).filter(Boolean).length,
    sims:    simHistory.length,
    storage: storageSize,
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ padding: 24, maxWidth: 640 }}>

      {/* Display */}
      <Section title="Display Preferences">
        <SettingRow
          label="Decimal Precision"
          sub={`Rates displayed to ${precision} decimal place${precision > 1 ? 's' : ''} — e.g. ${(1.23456789).toFixed(precision)}`}
          control={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="range" min="1" max="8" value={precision} onChange={e => setPrecision(+e.target.value)}
                style={{ width: 100, accentColor: T.accent }} />
              <span style={{ fontSize: 12, color: T.text, fontFamily: 'JetBrains Mono', minWidth: 16 }}>{precision}</span>
            </div>
          }
        />
      </Section>

      {/* Default Fees */}
      <Section title="Default Fee Configuration">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {[
            { label: 'Flat Fee per Swap', key: 'flat', step: '0.01', placeholder: '0' },
            { label: 'Percentage Fee (%)', key: 'pct',  step: '0.01', placeholder: '0.1' },
            { label: 'Slippage (%)',        key: 'slippage', step: '0.01', placeholder: '0.05' },
          ].map(({ label, key, step, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
              <input
                type="number" min="0" step={step} value={fees[key]} placeholder={placeholder}
                onChange={e => setFees({ ...fees, [key]: parseFloat(e.target.value) || 0 })}
                style={{
                  width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
                  padding: '8px 12px', color: T.text, fontSize: 13, fontFamily: 'JetBrains Mono', outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
          These defaults apply across all pages. You can override them per-page in the Arbitrage Engine and Simulator.
        </div>
      </Section>

      {/* Workspace Stats */}
      <Section title="Workspace Stats">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Units',        value: stats.units,   color: T.accent  },
            { label: 'Rates',        value: stats.rates,   color: T.cyan    },
            { label: 'Simulations',  value: stats.sims,    color: T.warning },
            { label: 'Storage (KB)', value: stats.storage, color: T.purple  },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Import / Export */}
      <Section title="Import / Export">
        <SettingRow
          label="Export Workspace"
          sub="Download full workspace as JSON (units, rates, meta, fees)"
          control={<Button variant="ghost" size="sm" onClick={exportWorkspace}>⬇ Export JSON</Button>}
        />
        <SettingRow
          label="Import Workspace"
          sub="Restore from a previously exported JSON file"
          control={
            <>
              <Button variant="ghost" size="sm" onClick={() => fileRef.current.click()}>⬆ Import JSON</Button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </>
          }
        />
        <SettingRow
          label="Clear Simulation History"
          sub={`${simHistory.length} simulation runs stored`}
          control={
            confirmClear ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="danger" size="sm" onClick={() => { clearSimHistory(); setConfirmClear(false) }}>Confirm</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)} disabled={simHistory.length === 0}>Clear History</Button>
            )
          }
        />
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <div style={{ padding: '14px 16px', background: `${T.loss}08`, border: `1px solid ${T.loss}25`, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Reset Workspace</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Restore all units, rates, and settings to factory defaults. This cannot be undone.</div>
            </div>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: 6, marginLeft: 16, flexShrink: 0 }}>
                <Button variant="danger" size="sm" onClick={() => { resetWorkspace(); setConfirmReset(false) }}>Yes, Reset</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)} style={{ marginLeft: 16, flexShrink: 0 }}>Reset</Button>
            )}
          </div>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: T.accent, fontWeight: 700, fontSize: 14 }}>ArbMatrix v3.0</span>
            {' '}— Custom Unit & Currency Matrix Arbitrage Explorer
          </div>
          <div><span style={{ color: T.text }}>Algorithm:</span> Bellman-Ford negative cycle detection with −ln(rate) edge transformation</div>
          <div><span style={{ color: T.text }}>Complexity:</span> O(V·E) per detection pass</div>
          <div><span style={{ color: T.text }}>Stack:</span> React 18 · Vite · Zustand · Framer Motion · React Flow · Recharts</div>
          <div><span style={{ color: T.text }}>Persistence:</span> Zustand persist middleware → localStorage</div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: `${T.accent}10`, border: `1px solid ${T.accent}20`, borderRadius: 6, color: T.accent, fontSize: 11 }}>
            B.Tech Computer Science & Engineering — Academic Case Study
          </div>
        </div>
      </Section>
    </motion.div>
  )
}

// tiny helper (avoids hooks-in-callbacks lint error)
function useMemo_(fn) { return fn() }
