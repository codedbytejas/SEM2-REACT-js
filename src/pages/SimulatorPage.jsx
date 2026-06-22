/*
=================================================
FILE: src/pages/SimulatorPage.jsx

Purpose:
Simulator page simulates compounding a loop over capital and shows ROI.

Is file mein:
1. simulateLoop helper use hota hai
2. Inputs for initial capital and steps

Viva Explanation:
Simulator demonstrates practical effect of fees/slippage on loops.
=================================================
*/
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities, simulateLoop } from '../lib/algorithms'
import { Button, Card, Input, Badge, EmptyState, AnimatedNumber, ProgressBar, SectionTitle, GRADIENT, SHADOW, T } from '../components/ui'
import { Icons } from '../components/layout'

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
        padding: '12px 0', borderBottom: index < total - 1 ? `1px solid ${T.border}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9, background: GRADIENT, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', boxShadow: '0 4px 10px rgba(79,70,235,0.28)',
        }}>
          {index + 1}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{step.from} → {step.to}</div>
          <div style={{ fontSize: 11, color: T.muted, fontFamily: 'JetBrains Mono' }}>@ {step.rate.toFixed(6)}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: T.muted }}>Before</div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{step.capitalBefore.toFixed(6)}</div>
        </div>
        <span style={{ color: T.muted }}>→</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: T.muted }}>After</div>
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

  // Hinglish: handleSimulate simulateLoop ko call karke result store karta aur simulation history me add karta.

  // Compound multiple runs
  const compoundRoi = result ? ((Math.pow(1 + result.roi / 100, runs) - 1) * 100) : null

  // Hinglish: compoundRoi compound interest formula se nikalta — agar runs zyada to exponential growth show karega.

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      {/* Config panel */}
      <Card hover={false} style={{ marginBottom: 20 }}>
        <SectionTitle color={T.accent} icon={<Icons.Settings />}>Simulation Parameters</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Input label="Initial Investment" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="100" />
          <Input label="% Fee per Swap" value={fees.pct} onChange={e => setFees({ ...fees, pct: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
          <Input label="Flat Fee per Swap" value={fees.flat} onChange={e => setFees({ ...fees, flat: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
          <Input label="Slippage %" value={fees.slippage} onChange={e => setFees({ ...fees, slippage: parseFloat(e.target.value) || 0 })} type="number" min="0" step="0.01" />
        </div>

        {/* Loop selector */}
        {opportunities.length > 0 ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Arbitrage Loop</label>
            <select
              value={opportunities.findIndex(o => o.id === loop?.id)}
              onChange={e => { const i = parseInt(e.target.value); setLoopIdx(i); setSelectedLoop(opportunities[i]) }}
              style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 13, padding: '10px 13px', cursor: 'pointer', outline: 'none' }}
            >
              {opportunities.map((o, i) => (
                <option key={i} value={i}>{o.path.join(' → ')} — Gross +{o.grossProfitPct.toFixed(3)}% / Net {o.netProfit > 0 ? '+' : ''}{o.netProfit.toFixed(3)}%</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ padding: '12px', background: `${T.warning}10`, border: `1px solid ${T.warning}30`, borderRadius: 9, fontSize: 12, color: T.warning, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Alert /> No arbitrage loops available. Adjust rates in the Exchange Matrix.
          </div>
        )}

        {/* Compound runs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Compound runs</label>
          <input type="range" min="1" max="20" value={runs} onChange={e => setRuns(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: T.accent }} />
          <span style={{ fontSize: 12, color: T.accent, fontFamily: 'JetBrains Mono', fontWeight: 700, minWidth: 28 }}>{runs}×</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <motion.button
            onClick={handleSimulate} disabled={!loop || running}
            whileHover={!(!loop || running) ? { y: -1 } : {}} whileTap={!(!loop || running) ? { scale: 0.97 } : {}}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', fontFamily: 'Inter',
              cursor: (!loop || running) ? 'not-allowed' : 'pointer', opacity: (!loop || running) ? 0.5 : 1,
              background: GRADIENT, boxShadow: '0 8px 18px rgba(79,70,235,0.3)',
            }}
          >
            {running ? 'Simulating…' : 'Run Simulation'}
          </motion.button>
          {result && <Button variant="ghost" onClick={() => setResult(null)}>Clear</Button>}
          {!loop && <Button variant="accent" onClick={() => setPage('arbitrage')} size="sm">Find Loops →</Button>}
        </div>
      </Card>

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
                { label: 'Starting Capital', value: result.initialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }), color: T.accent },
                { label: 'Final Capital',    value: result.finalCapital.toFixed(4),  color: result.roi >= 0 ? T.profit : T.loss },
                { label: 'Net Profit',       value: `${result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(4)}`, color: result.roi >= 0 ? T.profit : T.loss },
                { label: 'ROI',              value: `${result.roi >= 0 ? '+' : ''}${result.roi.toFixed(4)}%`, color: result.roi >= 0 ? T.profit : T.loss },
                ...(runs > 1 ? [{ label: `${runs}× Compound ROI`, value: `${compoundRoi >= 0 ? '+' : ''}${compoundRoi?.toFixed(3)}%`, color: compoundRoi >= 0 ? T.profit : T.loss }] : []),
              ].map((s, i) => (
                <div key={i} style={{ position: 'relative', overflow: 'hidden', background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 16px', textAlign: 'center', boxShadow: SHADOW }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}44)` }} />
                  <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                    <AnimatedNumber value={parseFloat(s.value.replace(/[^0-9.\-+]/g, '')) || 0} decimals={s.label.includes('ROI') || s.label.includes('Profit') ? 4 : 2}
                      prefix={s.label.includes('Capital') ? '' : ''} />
                  </div>
                </div>
              ))}
            </div>

            {/* Step breakdown */}
            <Card hover={false}>
              <SectionTitle color={T.purple} icon={<Icons.ArrowRight />}>Step-by-Step Breakdown</SectionTitle>
              {result.steps.map((s, i) => (
                <StepRow key={i} step={s} index={i} total={result.steps.length} />
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `2px solid ${T.border}`, fontWeight: 700 }}>
                <span style={{ fontSize: 14 }}>Final Result</span>
                <span style={{ color: result.roi >= 0 ? T.profit : T.loss, fontSize: 16, fontFamily: 'JetBrains Mono' }}>
                  {result.netProfit >= 0 ? '+' : ''}{result.netProfit.toFixed(6)} ({result.roi >= 0 ? '+' : ''}{result.roi.toFixed(4)}%)
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!loop && !running && (
        <Card hover={false}>
          <EmptyState icon={<Icons.Empty />} title="Configure simulation above" body="Select an arbitrage loop, set your initial investment and fee parameters, then click Run Simulation." />
        </Card>
      )}
    </div>
  )
}
