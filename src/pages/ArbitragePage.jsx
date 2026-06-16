import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities } from '../lib/algorithms'
import { Button, Card, Badge, ConfidenceBadge, StatusBadge, EmptyState, ProgressBar, T } from '../components/ui'

function FrictionPanel({ fees, setFees }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        ⚙ Transaction Friction Engine
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Flat Fee per Swap', key: 'flat', step: 0.01, placeholder: '0.00' },
          { label: 'Percentage Fee (%)', key: 'pct',  step: 0.01, placeholder: '0.10' },
          { label: 'Slippage (%)',       key: 'slippage', step: 0.01, placeholder: '0.05' },
        ].map(({ label, key, step, placeholder }) => (
          <div key={key}>
            <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input
              type="number" min="0" step={step} value={fees[key]}
              onChange={e => setFees({ ...fees, [key]: parseFloat(e.target.value) || 0 })}
              style={{
                width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
                padding: '8px 12px', color: T.text, fontSize: 13, fontFamily: 'JetBrains Mono', outline: 'none',
              }}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: T.muted }}>
        Total friction per swap: <span style={{ color: T.warning, fontFamily: 'JetBrains Mono' }}>{fees.pct + fees.slippage}% + ${fees.flat} flat</span>
      </div>
    </div>
  )
}

function OpportunityCard({ opp, index, onViewLoop, onSimulate }) {
  const statusColor = opp.netProfit > 1 ? T.profit : opp.netProfit > 0 ? T.warning : T.loss
  const isHigh = opp.grossProfitPct > 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.3 }}
      style={{
        background: T.card,
        border: `1px solid ${statusColor}28`,
        borderRadius: 12, padding: 18, cursor: 'default',
        boxShadow: isHigh ? `0 0 24px ${statusColor}14` : 'none',
      }}
      whileHover={{ borderColor: `${statusColor}55`, y: -2, transition: { duration: 0.15 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <ConfidenceBadge level={opp.confidence} />
            <StatusBadge status={opp.status} />
            <Badge color={T.muted}>{opp.steps} swap{opp.steps > 1 ? 's' : ''}</Badge>
            <span style={{ fontSize: 10, color: T.muted, marginLeft: 2 }}>#{index + 1}</span>
          </div>

          {/* Path */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginBottom: 12 }}>
            {opp.path.map((p, j) => (
              <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ padding: '4px 11px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{p}</span>
                {j < opp.path.length - 1 && <span style={{ color: statusColor, fontSize: 14 }}>→</span>}
              </span>
            ))}
          </div>

          {/* Metrics row */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: T.muted }}>GROSS  </span>
              <span style={{ color: T.profit, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>+{opp.grossProfitPct.toFixed(4)}%</span>
            </div>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: T.muted }}>FEE IMPACT  </span>
              <span style={{ color: T.loss, fontFamily: 'JetBrains Mono' }}>-{opp.feeImpact.toFixed(4)}%</span>
            </div>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: T.muted }}>RISK  </span>
              <span style={{ color: opp.risk < 40 ? T.profit : opp.risk < 70 ? T.warning : T.loss, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{opp.risk}/100</span>
            </div>
          </div>

          {/* Risk bar */}
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={opp.risk} max={100} color={opp.risk < 40 ? T.profit : opp.risk < 70 ? T.warning : T.loss} height={4} />
          </div>

          {opp.status === 'eliminated' && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: `${T.loss}12`, border: `1px solid ${T.loss}30`, borderRadius: 6, fontSize: 11, color: T.loss, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠ Arbitrage eliminated due to fees
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: statusColor, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
            +{opp.grossProfitPct.toFixed(3)}%
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
            Net: <span style={{ color: opp.netProfit > 0 ? T.profit : T.loss, fontFamily: 'JetBrains Mono' }}>
              {opp.netProfit > 0 ? '+' : ''}{opp.netProfit.toFixed(4)}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => onViewLoop(opp)}>View Loop</Button>
            <Button variant="success" size="sm" onClick={() => onSimulate(opp)}>Simulate</Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function ArbitragePage() {
  const { units, rates, fees, setFees, setSelectedLoop, setPage } = useAppStore()
  const [sort, setSort] = useState('profit')

  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])

  const sorted = useMemo(() => {
    const arr = [...opportunities]
    if (sort === 'profit') arr.sort((a, b) => b.netProfit - a.netProfit)
    else if (sort === 'risk') arr.sort((a, b) => a.risk - b.risk)
    else arr.sort((a, b) => a.steps - b.steps)
    return arr
  }, [opportunities, sort])

  const viewLoop = (opp) => { setSelectedLoop(opp); setPage('loop') }
  const simulate = (opp) => { setSelectedLoop(opp); setPage('simulator') }

  return (
    <div style={{ padding: 24 }}>
      <FrictionPanel fees={fees} setFees={setFees} />

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sort by</span>
        {[['profit','Highest Profit'], ['risk','Lowest Risk'], ['steps','Shortest Path']].map(([v, l]) => (
          <Button key={v} variant={sort === v ? 'primary' : 'ghost'} size="sm" onClick={() => setSort(v)}>{l}</Button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: T.muted }}>
          <span style={{ color: T.profit, fontWeight: 600 }}>{opportunities.filter(o => o.status === 'profitable').length}</span> profitable ·{' '}
          <span style={{ color: T.warning, fontWeight: 600 }}>{opportunities.filter(o => o.status === 'marginal').length}</span> marginal ·{' '}
          <span style={{ color: T.loss, fontWeight: 600 }}>{opportunities.filter(o => o.status === 'eliminated').length}</span> eliminated
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="🔍" title="No arbitrage cycles detected"
          body="The Bellman-Ford algorithm found no negative cycles in the current rate graph. Try adjusting rates in the Exchange Matrix."
          action={<Button variant="accent" onClick={() => setPage('matrix')} size="sm">Open Exchange Matrix</Button>}
        />
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((opp, i) => (
              <OpportunityCard key={opp.id} opp={opp} index={i} onViewLoop={viewLoop} onSimulate={simulate} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
