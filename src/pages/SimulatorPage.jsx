import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities, simulateLoop } from '../lib/algorithms'
import { Button, Card, Input, Badge, EmptyState, AnimatedNumber, ProgressBar, T } from '../components/ui'

function StepRow({ step, index, total }) {
  const change = step.capitalAfter - step.capitalBefore
  const changePct = (change / step.capitalBefore) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 0', borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: `${T.accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: T.accent,
        }}>
          {index + 1}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{step.from} → {step.to}</div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: 'JetBrains Mono' }}>@ {step.rate.toFixed(6)}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: T.muted }}>Before</div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{step.capitalBefore.toFixed(6)}</div>
        </div>
        <span style={{ color: T.muted }}>→</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: T.muted }}>After</div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: change >= 0 ? T.profit : T.loss }}>
            {step.capitalAfter.toFixed(6)}
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <div style={{ fontSize: 10, color: T.muted }}>Change</div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: changePct >= 0 ? T.profit : T.loss, fontWeight: 600 }}>
            {changePct >= 0 ? '+' : ''}{changePct.toFixed(3)}%
          </div>
        </div>
        {step.feePaid > 0.000001 && (
          <div style={{ textAlign: 'right', minWidth: 60 }}>
            <div style={{ fontSize: 10, color: T.muted }}>Fee paid</div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: T.loss }}>-{step.feePaid.toFixed(6)}</div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function SimulatorPage() {
  const { units, rates, fees, setFees, selectedLoop, setSelectedLoop, setPage, addSimResult } = useAppStore()
  const [amount, setAmount]   = useState('10000')
  const [loopIdx, setLoopIdx] = useState(0)
  const [result, setResult]   = useState(null)
  const [running, setRunning] = useState(false)
  const [runs, setRuns]       = useState(1)

  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  const loop = selectedLoop || opportunities[loopIdx]

  const handleSimulate = () => {
    if (!loop) return
    setRunning(true)
    setTimeout(() => {
      const res = simulateLoop(loop, parseFloat(amount) || 1, rates, fees)
      setResult(res)
      addSimResult({ loop: loop.path.join('→'), roi: res.roi, profit: res.netProfit, final: res.finalCapital, initial: res.initialAmount })
      setRunning(false)
    }, 600)
  }

  // Compound multiple runs
  const compoundRoi = result ? ((Math.pow(1 + result.roi / 100, runs) - 1) * 100) : null

  return (
    <div style={{ padding: 24, maxWidth: 820 }}>
      {/* Config panel */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Simulation Parameters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Input label="Initial Investment" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="100" />
          <Input label="% Fee per Swap" value={fees.pct} onChange={e => setFees({ ...fees, pct: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
          <Input label="Flat Fee per Swap" value={fees.flat} onChange={e => setFees({ ...fees, flat: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
          <Input label="Slippage %" value={fees.slippage} onChange={e => setFees({ ...fees, slippage: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
        </div>

        {/* Loop selector */}
        {opportunities.length > 0 ? (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Arbitrage Loop</label>
            <select
              value={opportunities.findIndex(o => o.id === loop?.id)}
              onChange={e => { const i = parseInt(e.target.value); setLoopIdx(i); setSelectedLoop(opportunities[i]) }}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 13, padding: '9px 13px', cursor: 'pointer', outline: 'none' }}
            >
              {opportunities.map((o, i) => (
                <option key={i} value={i}>{o.path.join(' → ')} — Gross +{o.grossProfitPct.toFixed(3)}% / Net {o.netProfit > 0 ? '+' : ''}{o.netProfit.toFixed(3)}%</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ padding: '12px', background: `${T.warning}10`, border: `1px solid ${T.warning}30`, borderRadius: 8, fontSize: 12, color: T.warning, marginBottom: 14 }}>
            ⚠ No arbitrage loops available. Adjust rates in the Exchange Matrix.
          </div>
        )}

        {/* Compound runs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: T.muted }}>Compound runs:</label>
          <input type="range" min="1" max="20" value={runs} onChange={e => setRuns(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: T.accent }} />
          <span style={{ fontSize: 12, color: T.text, fontFamily: 'JetBrains Mono', minWidth: 24 }}>{runs}×</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="primary" onClick={handleSimulate} disabled={!loop || running}>
            {running ? '⟳ Simulating…' : '▶ Run Simulation'}
          </Button>
          {result && <Button variant="ghost" onClick={() => setResult(null)}>Clear</Button>}
          {!loop && <Button variant="accent" onClick={() => setPage('arbitrage')} size="sm">Find Loops →</Button>}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Starting Capital', value: result.initialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: T.muted },
                { label: 'Final Capital',    value: result.finalCapital.toFixed(4),  color: result.roi >= 0 ? T.profit : T.loss },
                { label: 'Net Profit',       value: `${result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(4)}`, color: result.roi >= 0 ? T.profit : T.loss },
                { label: 'ROI',              value: `${result.roi >= 0 ? '+' : ''}${result.roi.toFixed(4)}%`, color: result.roi >= 0 ? T.profit : T.loss },
                ...(runs > 1 ? [{ label: `${runs}× Compound ROI`, value: `${compoundRoi >= 0 ? '+' : ''}${compoundRoi?.toFixed(3)}%`, color: compoundRoi >= 0 ? T.profit : T.loss }] : []),
              ].map((s, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${s.color}22`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                    <AnimatedNumber value={parseFloat(s.value.replace(/[^0-9.\-+]/g, '')) || 0} decimals={s.label.includes('ROI') || s.label.includes('Profit') ? 4 : 2}
                      prefix={s.label.includes('Capital') ? '' : ''} />
                  </div>
                </div>
              ))}
            </div>

            {/* Step breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Step-by-Step Breakdown
              </div>
              {result.steps.map((s, i) => (
                <StepRow key={i} step={s} index={i} total={result.steps.length} />
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: `2px solid ${T.border}`, fontWeight: 700 }}>
                <span style={{ fontSize: 14 }}>Final Result</span>
                <span style={{ color: result.roi >= 0 ? T.profit : T.loss, fontSize: 16, fontFamily: 'JetBrains Mono' }}>
                  {result.netProfit >= 0 ? '+' : ''}{result.netProfit.toFixed(6)} ({result.roi >= 0 ? '+' : ''}{result.roi.toFixed(4)}%)
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loop && !running && (
        <EmptyState icon="📈" title="Configure simulation above" body="Select an arbitrage loop, set your initial investment and fee parameters, then click Run Simulation." />
      )}
    </div>
  )
}
