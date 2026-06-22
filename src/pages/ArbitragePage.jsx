/*
=================================================
FILE: src/pages/ArbitragePage.jsx

Purpose:
Arbitrage page detected loops aur opportunities list karta hai.

Is file mein:
1. computeArbitrageOpportunities se data render hota hai
2. Each loop ki details aur actions (simulate/run) hoti hain

Viva Explanation:
Ye page algorithm output ko user-friendly view mein show karta hai.
=================================================
*/
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities } from '../lib/algorithms'
import { Button, Card, Badge, ConfidenceBadge, StatusBadge, EmptyState, ProgressBar, SectionTitle, SHADOW, T } from '../components/ui'
import { Icons } from '../components/layout'

function FrictionPanel({ fees, setFees }) {
  return (
    <Card hover={false} style={{ marginBottom: 18 }}>
      <SectionTitle color={T.warning} icon={<Icons.Settings />}>Transaction Friction Engine</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {[
          { label: 'Flat Fee per Swap', key: 'flat', step: 0.01, placeholder: '0.00' },
          { label: 'Percentage Fee (%)', key: 'pct',  step: 0.01, placeholder: '0.10' },
          { label: 'Slippage (%)',       key: 'slippage', step: 0.01, placeholder: '0.05' },
        ].map(({ label, key, step, placeholder }) => (
          <div key={key}>
            <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</label>
            <input
              type="number" min="0" step={step} value={fees[key]}
              onChange={e => setFees({ ...fees, [key]: parseFloat(e.target.value) || 0 })}
              style={{
                width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
                padding: '9px 12px', color: T.text, fontSize: 13, fontFamily: 'JetBrains Mono', outline: 'none',
              }}
              placeholder={placeholder}
            />
            {/* Hinglish: Fees input ko parseFloat se sanitize kiya ja raha hai, agar invalid input to 0 set ho jayega */}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', background: `${T.warning}12`, border: `1px solid ${T.warning}28`, borderRadius: 9, fontSize: 11.5, color: T.muted }}>
        Total friction / swap
        <span style={{ color: T.warning, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{(fees.pct + fees.slippage).toFixed(2)}% + ${fees.flat} flat</span>
        {/* Hinglish: Yahan total friction show kar rahe — UI read-only display. Agar formula change karo to sim results farak padega. */}
      </div>
    </Card>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 13px', minWidth: 104 }}>
      <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{value}</div>
    </div>
  )
}
// Hinglish: MiniStat chhote stat box banata — simple presentational component.

function OpportunityCard({ opp, index, onViewLoop, onSimulate }) {
  const statusColor = opp.netProfit > 1 ? T.profit : opp.netProfit > 0 ? T.warning : T.loss
  const riskColor = opp.risk < 40 ? T.profit : opp.risk < 70 ? T.warning : T.loss

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${statusColor}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'default', boxShadow: SHADOW,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: `${statusColor}18`, color: statusColor, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</span>
            <ConfidenceBadge level={opp.confidence} />
            <StatusBadge status={opp.status} />
            <Badge color={T.muted}>{opp.steps} swap{opp.steps > 1 ? 's' : ''}</Badge>
          </div>

          {/* Path */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 14 }}>
            {opp.path.map((p, j) => (
              <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '5px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{p}</span>
                {j < opp.path.length - 1 && <span style={{ color: statusColor, fontSize: 14 }}>→</span>}
              </span>
            ))}
          </div>
          {/* Hinglish: Path dikh raha — step-by-step swap sequence. Arrow visual sirf UX ke liye hai. */}

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <MiniStat label="Gross" value={`+${opp.grossProfitPct.toFixed(4)}%`} color={T.profit} />
            <MiniStat label="Fee Impact" value={`-${opp.feeImpact.toFixed(4)}%`} color={T.loss} />
            <MiniStat label="Risk" value={`${opp.risk}/100`} color={riskColor} />
          </div>

          {/* Risk bar */}
          <div style={{ marginTop: 12, maxWidth: 360 }}>
            <ProgressBar value={opp.risk} max={100} color={riskColor} height={5} />
          </div>

          {opp.status === 'eliminated' && (
            <div style={{ marginTop: 12, padding: '7px 11px', background: `${T.loss}12`, border: `1px solid ${T.loss}30`, borderRadius: 8, fontSize: 11, color: T.loss, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icons.Alert /> Arbitrage eliminated due to fees
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: statusColor, fontFamily: 'JetBrains Mono', lineHeight: 1, letterSpacing: '-0.02em' }}>
            +{opp.grossProfitPct.toFixed(3)}%
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Net <span style={{ color: opp.netProfit > 0 ? T.profit : T.loss, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
              {opp.netProfit > 0 ? '+' : ''}{opp.netProfit.toFixed(4)}%
            </span>
          </div>
          {/* Hinglish: Net profit dikhaya — positive/negative color se easily samajh sakein. */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => onViewLoop(opp)}>View Loop</Button>
            <Button variant="success" size="sm" onClick={() => onSimulate(opp)}>Simulate</Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CountPill({ color, value, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: `${color}12`, border: `1px solid ${color}26`, borderRadius: 20, fontSize: 11 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      <span style={{ color, fontWeight: 700 }}>{value}</span>
      <span style={{ color: T.muted }}>{label}</span>
    </span>
  )
}
// Hinglish: CountPill ek chhota pill style badge hai, summary counts ke liye use hota.

export default function ArbitragePage() {
  const { units, rates, fees, setFees, setSelectedLoop, setPage } = useAppStore()
  const [sort, setSort] = useState('profit')

  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  // Hinglish: Opportunities compute karne ke baad is array ko sorted/filtered karenge display ke liye.

  const sorted = useMemo(() => {
    const arr = [...opportunities]
    if (sort === 'profit') arr.sort((a, b) => b.netProfit - a.netProfit)
    else if (sort === 'risk') arr.sort((a, b) => a.risk - b.risk)
    else arr.sort((a, b) => a.steps - b.steps)
    return arr
  }, [opportunities, sort])

  const viewLoop = (opp) => { setSelectedLoop(opp); setPage('loop') }
  const simulate = (opp) => { setSelectedLoop(opp); setPage('simulator') }

  // Hinglish: viewLoop aur simulate state change karte — ye navigation ki tarah kaam karta hai (page switch via store).

  return (
    <div style={{ padding: 24 }}>
      <FrictionPanel fees={fees} setFees={setFees} />

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Sort by</span>
        {[['profit','Highest Profit'], ['risk','Lowest Risk'], ['steps','Shortest Path']].map(([v, l]) => (
          <Button key={v} variant={sort === v ? 'primary' : 'ghost'} size="sm" onClick={() => setSort(v)}>{l}</Button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <CountPill color={T.profit}  value={opportunities.filter(o => o.status === 'profitable').length} label="profitable" />
          <CountPill color={T.warning} value={opportunities.filter(o => o.status === 'marginal').length}   label="marginal" />
          <CountPill color={T.loss}    value={opportunities.filter(o => o.status === 'eliminated').length} label="eliminated" />
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card hover={false}>
          <EmptyState
            icon={<Icons.Empty />} title="No arbitrage cycles detected"
            body="The Bellman-Ford algorithm found no negative cycles in the current rate graph. Try adjusting rates in the Exchange Matrix."
            action={<Button variant="accent" onClick={() => setPage('matrix')} size="sm">Open Exchange Matrix</Button>}
          />
        </Card>
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
