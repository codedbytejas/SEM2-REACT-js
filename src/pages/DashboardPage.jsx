/*
=================================================
FILE: src/pages/DashboardPage.jsx

Purpose:
Yeh Dashboard page render karta hai — overview cards, summaries aur charts.

Is file mein:
1. Store se summary data le kar cards show hote hain
2. Charts aur lists render hote hain

Viva Explanation:
Dashboard ek summary view hai jo multiple child components ko combine karta hai.
=================================================
*/
// React hook for memoization
import { useMemo } from 'react'
// framer-motion for animation wrappers
import { motion } from 'framer-motion'
// Custom Zustand store hook — global app state
import useAppStore from '../store/useAppStore'
// Algorithm helpers
import { computeArbitrageOpportunities, countActivePaths } from '../lib/algorithms'
// UI primitives used in this page
import { Card, Button, EmptyState, ProgressBar, T, SHADOW } from '../components/ui'
// Icon set from layout
import { Icons } from '../components/layout'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.3 } },
}

// ─── KPI tile ─────────────────────────────────────────────────────────────────
// Small KPI tile component used multiple times on dashboard
// Shows a label, a big value and a small icon chip
function Kpi({ icon, label, value, sub, color, pulse }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: '18px 18px 16px', boxShadow: SHADOW,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${color}, ${color}AA)`,
          boxShadow: `0 4px 12px ${color}38`,
          animation: pulse ? 'pulse-glow-green 2.2s infinite' : 'none',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'JetBrains Mono', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.muted }}>{sub}</div>
    </motion.div>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────
// Reusable section header within pages
function SectionTitle({ color, children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{children}</span>
      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </div>
  )
}

// ─── Hero button ──────────────────────────────────────────────────────────────
// Simple button component used in hero area. `solid` toggles styling.
function HeroBtn({ children, onClick, solid }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
        fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
        border: solid ? 'none' : '1px solid rgba(255,255,255,0.35)',
        background: solid ? '#fff' : 'rgba(255,255,255,0.12)',
        color: solid ? '#2563EB' : '#fff',
      }}
    >
      {children}
    </motion.button>
  )
}

export default function DashboardPage() {
  // Use global store values
  const { units, rates, fees, unitMeta, simHistory, setPage, setSelectedLoop } = useAppStore()

  // Compute opportunities only when units/rates/fees change (expensive)
  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  // Count active directed edges in the rate graph
  const activePaths   = useMemo(() => countActivePaths(units, rates), [units, rates])
  // Pick the best opportunity (first after sorting in compute function)
  const best = opportunities[0]
  // Quick stats computed from opportunities array
  const profitableCount = opportunities.filter(o => o.status === 'profitable').length
  const avgRisk = opportunities.length
    ? Math.round(opportunities.reduce((a, b) => a + b.risk, 0) / opportunities.length)
    : null

  // Prepare small dataset for the profit distribution UI (limits to top 8)
  const profitBuckets = useMemo(() => {
    return opportunities.slice(0, 8).map((o, i) => ({
      label: `Loop ${i + 1}`,
      gross: +o.grossProfitPct.toFixed(4),
      net: +o.netProfit.toFixed(4),
      color: o.status === 'profitable' ? T.profit : o.status === 'marginal' ? T.warning : T.loss,
    }))
  }, [opportunities])

  // Hinglish: profitBuckets top opportunities ka chhota dataset banata — UI me top results dikhane ke liye.

  // Recent simulation history and risk color mapping for display
  const recentSims = simHistory.slice(-5).reverse()
  const riskColor = avgRisk === null ? T.muted : avgRisk < 40 ? T.profit : avgRisk < 70 ? T.warning : T.loss

  // Hinglish: riskColor dashboard ke kuch tiles me use hota; agar avgRisk null ho to muted dikhaye.

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ─── Hero banner ─────────────────────────────────────────────── */}
      <motion.div
        variants={item}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '26px 28px', color: '#fff',
          background: 'linear-gradient(120deg, #2563EB 0%, #4F46E5 48%, #7C3AED 100%)',
          boxShadow: '0 16px 40px rgba(79,70,229,0.28)',
        }}
      >
        {/* decorative glow blobs */}
        <div style={{ position: 'absolute', top: -70, right: -20, width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.20), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -90, right: 150, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.30), transparent 70%)' }} />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.16)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', animation: 'pulse-glow-green 2s infinite' }} />
              Live Arbitrage Engine
            </div>
            <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 8 }}>
              {best
                ? `${opportunities.length} profitable ${opportunities.length === 1 ? 'cycle' : 'cycles'} detected`
                : 'Markets are balanced'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
              {best
                ? <>Best route delivers a gross return across {best.steps} swaps — confidence rated <strong>{best.confidence}</strong>.</>
                : 'No negative cycles in the current rate graph. Adjust rates in the Exchange Matrix to surface opportunities.'}
            </p>

            {best && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 16 }}>
                {best.path.map((p, j) => (
                  <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{p}</span>
                    {j < best.path.length - 1 && <span style={{ opacity: 0.75, fontSize: 15 }}>→</span>}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              {best ? (
                <>
                  <HeroBtn solid onClick={() => { setSelectedLoop(best); setPage('loop') }}>View Loop</HeroBtn>
                  <HeroBtn onClick={() => setPage('simulator')}>Simulate</HeroBtn>
                  <HeroBtn onClick={() => setPage('arbitrage')}>All Opportunities</HeroBtn>
                </>
              ) : (
                <HeroBtn solid onClick={() => setPage('matrix')}>Open Exchange Matrix</HeroBtn>
              )}
            </div>
          </div>

          {best && (
            <div style={{ textAlign: 'right', minWidth: 150 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>Best Gross ROI</div>
              <div style={{ fontSize: 46, fontWeight: 800, fontFamily: 'JetBrains Mono', lineHeight: 1, letterSpacing: '-0.03em' }}>
                +{best.grossProfitPct.toFixed(2)}<span style={{ fontSize: 24 }}>%</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                Net after fees{' '}
                <strong style={{ color: best.netProfit > 0 ? '#6EE7B7' : '#FCA5A5' }}>
                  {best.netProfit > 0 ? '+' : ''}{best.netProfit.toFixed(3)}%
                </strong>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── KPI tiles ───────────────────────────────────────────────── */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(196px, 1fr))', gap: 14 }}>
        <Kpi icon={<Icons.Hexagon />}    label="Active Units"      value={units.length}        sub="Nodes in graph"        color={T.accent} />
        <Kpi icon={<Icons.ArrowRight />} label="Conversion Paths"  value={activePaths}         sub="Directed edges"        color={T.cyan} />
        <Kpi icon={<Icons.Zap />}        label="Arbitrage Loops"   value={opportunities.length} sub="Detected cycles"      color={T.profit} pulse={opportunities.length > 0} />
        <Kpi icon={<Icons.Target />}     label="Profitable"        value={profitableCount}     sub="Net positive after fees" color={T.purple} />
        {avgRisk !== null && (
          <Kpi icon={<Icons.Alert />} label="Avg Risk Score" value={`${avgRisk}`} sub={avgRisk < 40 ? 'Low risk environment' : avgRisk < 70 ? 'Moderate risk' : 'High risk'} color={riskColor} />
        )}
      </motion.div>

      {/* ─── Content row ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16, alignItems: 'stretch' }}>

        {/* Profit distribution */}
        <motion.div variants={item} style={{ height: '100%' }}>
          <Card hover={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionTitle color={T.profit} action={<span style={{ fontSize: 11, color: T.muted }}>Top {profitBuckets.length}</span>}>Profit Distribution</SectionTitle>
            {profitBuckets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profitBuckets.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 7, background: `${d.color}18`, color: d.color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                        <span style={{ color: T.muted }}>{d.label}</span>
                        <span style={{ color: d.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                          +{d.gross.toFixed(4)}% <span style={{ color: T.muted, fontWeight: 400 }}>(net {d.net.toFixed(3)}%)</span>
                        </span>
                      </div>
                      <ProgressBar value={d.gross} max={Math.max(...profitBuckets.map(x => x.gross)) * 1.2} color={d.color} height={6} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Icons.Empty />} title="No arbitrage detected" body="Adjust conversion rates in the Exchange Matrix to create profitable cycles." action={<Button variant="accent" onClick={() => setPage('matrix')} size="sm">Open Matrix</Button>} />
            )}
          </Card>
        </motion.div>

        {/* Active units + recent sims */}
        <motion.div variants={item} style={{ height: '100%' }}>
          <Card hover={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <SectionTitle color={T.accent} action={<span style={{ fontSize: 11, color: T.muted }}>{units.length} total</span>}>Active Units</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {units.map(u => {
                const meta = unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }
                const paths = Object.values(rates[u] || {}).filter(Boolean).length
                return (
                  <motion.div key={u} whileHover={{ scale: 1.04, y: -1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', background: `${meta.color}10`, border: `1px solid ${meta.color}2e`, borderRadius: 10, cursor: 'default' }}
                  >
                    <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, background: `${meta.color}1f`, color: meta.color, fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, lineHeight: 1.1 }}>{u}</div>
                      <div style={{ fontSize: 9, color: T.muted }}>{paths} paths</div>
                    </div>
                  </motion.div>
                )
              })}
              <motion.div whileHover={{ scale: 1.04, y: -1 }}
                onClick={() => setPage('units')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(15,23,42,0.03)', border: `1px dashed ${T.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: T.muted }}
              >
                + Add unit
              </motion.div>
            </div>

            {recentSims.length > 0 && (
              <div style={{ marginTop: 18, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Recent Simulations</div>
                {recentSims.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '7px 0', borderBottom: i < recentSims.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{ color: T.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.loop}</span>
                    <span style={{ color: s.roi >= 0 ? T.profit : T.loss, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {s.roi >= 0 ? '+' : ''}{s.roi.toFixed(3)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
