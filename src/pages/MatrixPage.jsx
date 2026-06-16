import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { buildMatrix, heatColor, fmt } from '../lib/algorithms'
import { Button, Card, Input, SHADOW, T } from '../components/ui'

export default function MatrixPage() {
  const { units, rates, unitMeta, setRate, removeRate, exportWorkspace } = useAppStore()
  const [search, setSearch]     = useState('')
  const [editCell, setEditCell] = useState(null)  // { from, to }
  const [editVal, setEditVal]   = useState('')
  const [flashCells, setFlash]  = useState({})
  const [heatmap, setHeatmap]   = useState(false)
  const inputRef = useRef()

  const filtered = useMemo(() =>
    units.filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [units, search]
  )

  const allRates = useMemo(() => {
    const values = []
    for (const f of filtered) for (const t of filtered) {
      const r = rates[f]?.[t]
      if (r && f !== t) values.push(r)
    }
    return values
  }, [filtered, rates])

  const [rateMin, rateMax] = useMemo(() => [Math.min(...allRates), Math.max(...allRates)], [allRates])

  const flash = useCallback((from, to, dir) => {
    const k = `${from}-${to}`
    setFlash(p => ({ ...p, [k]: dir }))
    setTimeout(() => setFlash(p => { const n = { ...p }; delete n[k]; return n }), 700)
  }, [])

  const commitEdit = useCallback((from, to, raw) => {
    const num = parseFloat(raw)
    if (!isNaN(num) && num > 0 && from !== to) {
      const prev = rates[from]?.[to]
      flash(from, to, prev ? (num > prev ? 'green' : 'red') : 'green')
      setRate(from, to, num)
    }
    setEditCell(null)
  }, [rates, setRate, flash])

  const startEdit = (from, to) => {
    if (from === to) return
    setEditCell({ from, to })
    setEditVal(rates[from]?.[to]?.toString() || '')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const handleKeyDown = (e, from, to) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEdit(from, to, editVal) }
    if (e.key === 'Escape') setEditCell(null)
    // Arrow navigation
    if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault()
      commitEdit(from, to, editVal)
      const fi = filtered.indexOf(from), ti = filtered.indexOf(to)
      let nf = fi, nt = ti
      if (e.key === 'ArrowRight') nt = Math.min(filtered.length - 1, ti + 1)
      if (e.key === 'ArrowLeft')  nt = Math.max(0, ti - 1)
      if (e.key === 'ArrowDown')  nf = Math.min(filtered.length - 1, fi + 1)
      if (e.key === 'ArrowUp')    nf = Math.max(0, fi - 1)
      if (nf !== fi || nt !== ti) startEdit(filtered[nf], filtered[nt])
    }
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ units, rates }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'arb_matrix.json'; a.click()
  }

  const headBg = '#F1F4FB'
  const totalRates = Object.values(rates).flatMap(Object.values).filter(Boolean).length

  return (
    <div style={{ padding: 24 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 14px', flex: '0 0 230px', boxShadow: SHADOW }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter units…"
            style={{ background: 'none', border: 'none', color: T.text, fontSize: 12, width: '100%', outline: 'none' }} />
        </div>
        <Button variant={heatmap ? 'accent' : 'ghost'} onClick={() => setHeatmap(h => !h)} size="sm">
          Heatmap {heatmap ? 'ON' : 'OFF'}
        </Button>
        <Button variant="ghost" onClick={exportJSON} size="sm">Export JSON</Button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: `${T.accent}10`, border: `1px solid ${T.accent}22`, borderRadius: 20, fontSize: 11, color: T.muted }}>
          <span style={{ color: T.accent, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{filtered.length}×{filtered.length}</span> matrix ·
          <span style={{ color: T.accent, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{totalRates}</span> rates
        </div>
      </div>

      {/* Matrix table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'auto', maxHeight: 'calc(100vh - 230px)', boxShadow: SHADOW }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{
                position: 'sticky', top: 0, left: 0, zIndex: 10,
                background: headBg, padding: '12px 16px', fontSize: 9.5,
                color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
                borderRight: `1px solid ${T.border}`, borderBottom: `2px solid ${T.accent}33`,
                minWidth: 116, textAlign: 'left',
              }}>
                From ↓ / To →
              </th>
              {filtered.map(u => {
                const meta = unitMeta[u] || { icon: '•', color: T.accent }
                return (
                  <th key={u} style={{
                    position: 'sticky', top: 0, zIndex: 5,
                    background: headBg, borderBottom: `2px solid ${meta.color}44`,
                    padding: '9px 12px', minWidth: 110,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, background: `${meta.color}1c`, color: meta.color, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{meta.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{u}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((from, fi) => {
              const fromMeta = unitMeta[from] || { icon: '•', color: T.accent }
              return (
                <tr key={from}>
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 4,
                    background: headBg, borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
                    padding: '8px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, background: `${fromMeta.color}1c`, color: fromMeta.color, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fromMeta.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: fromMeta.color }}>{from}</span>
                    </div>
                  </td>

                  {filtered.map((to, ti) => {
                    if (from === to) return (
                      <td key={to} style={{ textAlign: 'center', color: T.muted, fontSize: 16, background: 'rgba(15,23,42,0.025)', borderBottom: `1px solid ${T.border}` }}>—</td>
                    )
                    const rate = rates[from]?.[to]
                    const cellKey = `${from}-${to}`
                    const isEditing = editCell?.from === from && editCell?.to === to
                    const flashDir = flashCells[cellKey]
                    const bgColor = heatmap && rate ? heatColor(rate, rateMin, rateMax) : 'transparent'

                    return (
                      <td key={to}
                        className={flashDir === 'green' ? 'flash-green' : flashDir === 'red' ? 'flash-red' : ''}
                        style={{ textAlign: 'center', padding: 5, transition: 'background 0.2s', background: bgColor, borderBottom: `1px solid ${T.border}` }}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={() => commitEdit(from, to, editVal)}
                            onKeyDown={e => handleKeyDown(e, from, to)}
                            style={{
                              width: 90, textAlign: 'center', fontSize: 12, fontFamily: 'JetBrains Mono',
                              background: `${T.accent}14`, border: `1.5px solid ${T.accent}`,
                              borderRadius: 6, color: T.text, padding: '5px 4px', outline: 'none',
                            }}
                          />
                        ) : (
                          <motion.div
                            onClick={() => startEdit(from, to)}
                            whileHover={{ scale: 1.05 }}
                            style={{
                              padding: '6px 8px', borderRadius: 7, cursor: 'pointer', fontSize: 11,
                              background: rate ? `${T.accent}0c` : 'transparent',
                              border: `1px solid ${rate ? `${T.accent}22` : 'transparent'}`,
                              color: rate ? T.text : T.muted, fontFamily: 'JetBrains Mono', fontWeight: rate ? 500 : 400,
                              transition: 'all 0.15s',
                            }}
                          >
                            {rate ? fmt(rate, 5) : <span style={{ fontSize: 10, color: T.muted }}>+ set</span>}
                          </motion.div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 18, fontSize: 11, color: T.muted, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
          Click any cell to edit · Arrow keys to navigate · Enter to confirm
        </span>
        {heatmap && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, #2563EB, #059669)' }} />
            Blue = low rate · Green = high rate (relative)
          </span>
        )}
      </div>
    </div>
  )
}
