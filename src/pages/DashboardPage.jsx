import { useMemo } from 'react'
import { motion } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities, countActivePaths } from '../lib/algorithms'
import { StatCard, Card, Badge, ConfidenceBadge, Button, EmptyState, ProgressBar, AnimatedNumber, T } from '../components/ui'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.3 } },
}

export default function DashboardPage() {
  const { units, rates, fees, unitMeta, simHistory, setPage, setSelectedLoop } = useAppStore()

  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  const activePaths   = useMemo(() => countActivePaths(units, rates), [units, rates])
  const best = opportunities[0]
  const avgRisk = opportunities.length
    ? Math.round(opportunities.reduce((a, b) => a + b.risk, 0) / opportunities.length)
    : null

  const profitBuckets = useMemo(() => {
    return opportunities.slice(0, 8).map((o, i) => ({
      label: `Loop ${i + 1}`,
      gross: +o.grossProfitPct.toFixed(4),
      net: +o.netProfit.toFixed(4),
      color: o.status === 'profitable' ? T.profit : o.status === 'marginal' ? T.warning : T.loss,
    }))
  }, [opportunities])

  const recentSims = simHistory.slice(-5).reverse()

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stat Cards */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatCard label="Active Units" value={units.length} sub="Nodes in graph" color={T.accent} icon="⬡" />
        <StatCard label="Conversion Paths" value={activePaths} sub="Directed edges" color={T.cyan} icon="⟶" />
        <StatCard label="Arbitrage Loops" value={opportunities.length} sub="Profitable cycles" color={T.profit} icon="⚡" pulse={opportunities.length > 0} />
        <StatCard
          label="Best ROI"
          value={best ? `+${best.grossProfitPct.toFixed(3)}%` : '—'}
          sub={best ? best.path.join(' → ') : 'No opportunities detected'}
          color={T.warning} icon="🎯"
        />
        {avgRisk !== null && <StatCard label="Avg Risk Score" value={`${avgRisk}/100`} sub={avgRisk < 40 ? 'Low risk environment' : avgRisk < 70 ? 'Moderate risk' : 'High risk'} color={avgRisk < 40 ? T.profit : avgRisk < 70 ? T.warning : T.loss} icon="⚠" />}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Profit distribution */}
        <motion.div variants={item}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Profit Distribution</div>
            {profitBuckets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profitBuckets.map((d, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: T.muted }}>{d.label}</span>
                      <span style={{ color: d.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                        +{d.gross.toFixed(4)}% <span style={{ color: T.muted, fontWeight: 400 }}>(net {d.net.toFixed(3)}%)</span>
                      </span>
                    </div>
                    <ProgressBar value={d.gross} max={Math.max(...profitBuckets.map(x => x.gross)) * 1.2} color={d.color} height={5} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="📊" title="No arbitrage detected" body="Adjust conversion rates in the Exchange Matrix to create profitable cycles." action={<Button variant="accent" onClick={() => setPage('matrix')} size="sm">Open Matrix</Button>} />
            )}
          </Card>
        </motion.div>

        {/* Unit grid */}
        <motion.div variants={item}>
          <Card style={{ height: '100%' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Active Units</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {units.map(u => {
                const meta = unitMeta[u] || { icon: '🔷', color: T.accent, category: 'Custom' }
                const paths = Object.values(rates[u] || {}).filter(Boolean).length
                return (
                  <motion.div key={u} whileHover={{ scale: 1.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: `${meta.color}12`, border: `1px solid ${meta.color}30`, borderRadius: 20, cursor: 'default' }}
                  >
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, lineHeight: 1 }}>{u}</div>
                      <div style={{ fontSize: 9, color: T.muted }}>{paths} paths</div>
                    </div>
                  </motion.div>
                )
              })}
              <motion.div whileHover={{ scale: 1.04 }}
                onClick={() => setPage('units')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: `1px dashed ${T.border}`, borderRadius: 20, cursor: 'pointer', fontSize: 11, color: T.muted }}
              >
                + Add unit
              </motion.div>
            </div>

            {recentSims.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Simulations</div>
                {recentSims.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
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

      {/* Best opportunity hero card */}
      {best && (
        <motion.div variants={item}>
          <Card glowColor={T.profit} style={{ border: `1px solid ${T.profit}30`, background: `linear-gradient(135deg, rgba(0,230,118,0.04) 0%, rgba(7,11,20,0) 60%)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.profit, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚡ Top Arbitrage Opportunity</span>
                  <ConfidenceBadge level={best.confidence} />
                  <Badge color={T.muted}>{best.steps} swaps</Badge>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {best.path.map((p, j) => (
                    <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '5px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{p}</span>
                      {j < best.path.length - 1 && <span style={{ color: T.profit, fontSize: 18, fontWeight: 300 }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.profit, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                  +{best.grossProfitPct.toFixed(4)}%
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Net after fees: <span style={{ color: best.netProfit > 0 ? T.profit : T.loss, fontFamily: 'JetBrains Mono' }}>{best.netProfit > 0 ? '+' : ''}{best.netProfit.toFixed(4)}%</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Button variant="success" size="sm" onClick={() => { setSelectedLoop(best); setPage('loop') }}>View Loop</Button>
              <Button variant="ghost" size="sm" onClick={() => setPage('simulator')}>Simulate</Button>
              <Button variant="ghost" size="sm" onClick={() => setPage('arbitrage')}>All Opportunities</Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
