import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities } from '../lib/algorithms'
import { Button, Badge, ConfidenceBadge, Card, EmptyState, AnimatedNumber, SectionTitle, GRADIENT, SHADOW, T } from '../components/ui'
import { Icons } from '../components/layout'

// Custom node for React Flow
function UnitNode({ data }) {
  const { label, icon, color, isActive, isPast, amount } = data
  return (
    <div style={{
      width: 90, height: 90, borderRadius: '50%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      background: isActive ? `${color}25` : isPast ? `${T.accent}12` : '#FFFFFF',
      border: `2.5px solid ${isActive ? color : isPast ? T.accent : T.border}`,
      boxShadow: isActive ? `0 0 28px ${color}50, 0 0 8px ${color}30` : SHADOW,
      transition: 'all 0.4s ease',
      animation: isActive ? 'pulse-glow-blue 1.5s infinite' : 'none',
      cursor: 'default',
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: isActive ? color : isPast ? T.accent : T.text }}>{label}</span>
      {amount !== undefined && (
        <span style={{ fontSize: 9, color: isActive ? color : T.muted, fontFamily: 'JetBrains Mono' }}>
          {typeof amount === 'number' ? amount.toFixed(4) : amount}
        </span>
      )}
    </div>
  )
}

const nodeTypes = { unit: UnitNode }

function buildFlowGraph(loop, unitMeta, step, stepData) {
  if (!loop) return { nodes: [], edges: [] }
  const n = loop.path.length - 1
  const W = 560, H = 320
  const nodes = loop.path.slice(0, n).map((name, i) => {
    const meta = unitMeta[name] || { icon: '•', color: T.accent }
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return {
      id: name,
      type: 'unit',
      position: {
        x: W / 2 + (W / 2.4) * Math.cos(angle) - 45,
        y: H / 2 + (H / 2.3) * Math.sin(angle) - 45,
      },
      data: {
        label: name,
        icon: meta.icon,
        color: meta.color,
        isActive: i === step,
        isPast: i < step,
        amount: stepData[i] ? (i === step ? stepData[i].capitalBefore : stepData[i - 1]?.capitalAfter) : undefined,
      },
    }
  })

  const edges = loop.path.slice(0, n).map((from, i) => {
    const to = loop.path[(i + 1) % n]
    const isPast = i < step
    const isActive = i === step
    const sd = stepData[i]
    return {
      id: `${from}-${to}`,
      source: from, target: to,
      type: 'smoothstep',
      animated: isActive,
      label: sd ? `×${sd.rate.toFixed(4)}` : '',
      style: {
        stroke: isActive ? T.profit : isPast ? T.accent : T.border,
        strokeWidth: isActive ? 3 : isPast ? 1.5 : 1,
        opacity: i > step ? 0.3 : 1,
      },
      labelStyle: { fill: isActive ? T.profit : T.muted, fontSize: 10, fontFamily: 'JetBrains Mono' },
      markerEnd: { type: 'arrowclosed', color: isActive ? T.profit : isPast ? T.accent : T.muted },
    }
  })

  return { nodes, edges }
}

export default function LoopVisualizerPage() {
  const { units, rates, fees, unitMeta, selectedLoop, setSelectedLoop, setPage } = useAppStore()
  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])

  const loop = selectedLoop || opportunities[0]
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)

  // Step data: full simulation
  const stepData = useMemo(() => {
    if (!loop) return []
    let capital = 1
    return loop.path.slice(0, loop.path.length - 1).map((from, i) => {
      const to = loop.path[i + 1]
      const rate = rates[from]?.[to] || 1
      const before = capital
      const afterR = capital * rate
      const afterS = afterR * (1 - fees.slippage / 100)
      const afterF = afterS - fees.flat
      const afterP = afterF * (1 - fees.pct / 100)
      capital = afterP
      return { from, to, rate, capitalBefore: before, capitalAfter: afterP, feePaid: before - afterP }
    })
  }, [loop, rates, fees])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setStep(s => {
        if (s >= (loop?.steps || 0) - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 900)
    return () => clearInterval(id)
  }, [playing, loop])

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFlowGraph(loop, unitMeta, step, stepData),
    [loop, unitMeta, step, stepData]
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  useEffect(() => {
    const { nodes: n, edges: e } = buildFlowGraph(loop, unitMeta, step, stepData)
    setNodes(n); setEdges(e)
  }, [loop, step, stepData, unitMeta])

  const reset = () => { setStep(-1); setPlaying(false) }
  const play  = () => { if (step >= (loop?.steps || 0) - 1) reset(); setPlaying(p => !p) }

  const finalCapital = stepData.length ? stepData[stepData.length - 1].capitalAfter : 1
  const roi = (finalCapital - 1) * 100

  if (!loop) return (
    <div style={{ padding: 24 }}>
      <Card hover={false}>
        <EmptyState icon={<Icons.Empty />} title="No loop selected" body="Go to the Arbitrage Engine and click 'View Loop' on an opportunity, or ensure your Exchange Matrix has profitable cycles." action={<Button variant="accent" onClick={() => setPage('arbitrage')} size="sm">Arbitrage Engine</Button>} />
      </Card>
    </div>
  )

  const progress = loop.steps > 0 ? Math.max(0, step + 1) / loop.steps : 0

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <Card hover={false} style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <motion.button
            onClick={play} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9,
              fontSize: 12.5, fontWeight: 700, color: '#fff', border: 'none', fontFamily: 'Inter', cursor: 'pointer',
              background: playing ? T.loss : GRADIENT, boxShadow: playing ? 'none' : '0 8px 18px rgba(79,70,235,0.3)',
            }}
          >
            {playing ? 'Pause' : step === -1 ? 'Play' : 'Resume'}
          </motion.button>
          <Button variant="ghost" onClick={reset} size="sm">Reset</Button>
          <Button variant="ghost" onClick={() => setStep(s => Math.max(-1, s - 1))} size="sm" disabled={step < 0}>Prev</Button>
          <Button variant="ghost" onClick={() => setStep(s => Math.min((loop?.steps || 0) - 1, s + 1))} size="sm" disabled={step >= (loop?.steps || 0) - 1}>Next</Button>

          {opportunities.length > 1 && (
            <select
              onChange={e => { setSelectedLoop(opportunities[parseInt(e.target.value)]); reset() }}
              value={opportunities.findIndex(o => o.id === loop?.id)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 12, padding: '8px 11px', cursor: 'pointer', outline: 'none' }}
            >
              {opportunities.map((o, i) => (
                <option key={i} value={i}>Loop {i + 1}: {o.path.join(' → ')} (+{o.grossProfitPct.toFixed(3)}%)</option>
              ))}
            </select>
          )}

          <div style={{ flex: 1 }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px', background: `${T.accent}10`, border: `1px solid ${T.accent}22`, borderRadius: 20, fontSize: 12, color: T.muted }}>
            Step <span style={{ color: T.accent, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{step + 1}</span> / <span style={{ color: T.accent, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{loop.steps}</span>
          </div>
        </div>
        {/* progress strip */}
        <div style={{ marginTop: 12, height: 4, borderRadius: 4, background: 'rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', borderRadius: 4, background: GRADIENT }} />
        </div>
      </Card>

      {/* React Flow graph */}
      <Card hover={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 4, height: 18, borderRadius: 2, background: T.profit }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Conversion Cycle</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <ConfidenceBadge level={loop.confidence} />
            <Badge color={T.muted}>{loop.steps} swaps</Badge>
          </div>
        </div>
        <div style={{ height: 360, background: T.bg }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3} maxZoom={3}
            style={{ background: T.bg }}
            deleteKeyCode={null}
          >
            <Background color={T.border} gap={24} size={1} />
            <Controls />
            <MiniMap nodeColor={n => n.data?.color || T.accent} maskColor="rgba(244,246,251,0.6)" />
          </ReactFlow>
        </div>
      </Card>

      {/* Step cards */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {stepData.map((s, i) => {
          const isActive = i === step
          const isPast = i < step
          const accent = isActive ? T.profit : isPast ? T.accent : T.border
          return (
            <motion.div
              key={i}
              onClick={() => setStep(i)}
              whileHover={{ y: -3 }}
              style={{
                position: 'relative', overflow: 'hidden',
                minWidth: 156, padding: '16px 14px 14px', background: T.card, cursor: 'pointer',
                border: `1px solid ${isActive ? T.profit : isPast ? `${T.accent}66` : T.border}`,
                borderRadius: 12, opacity: i > step + 1 ? 0.5 : 1,
                boxShadow: isActive ? `0 8px 20px ${T.profit}22` : SHADOW,
                transition: 'all 0.3s', flexShrink: 0,
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isActive ? GRADIENT : accent }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: isActive ? GRADIENT : `${T.accent}16`, color: isActive ? '#fff' : T.accent, fontSize: 11, fontWeight: 800, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.from} → {s.to}</span>
              </div>
              <div style={{ fontSize: 10, color: T.muted }}>Rate</div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 6 }}>×{s.rate.toFixed(5)}</div>
              <div style={{ fontSize: 10, color: T.muted }}>Before → After</div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: T.text }}>{s.capitalBefore.toFixed(5)}</div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: T.profit }}>→ {s.capitalAfter.toFixed(5)}</div>
              {s.feePaid > 0.000001 && (
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: T.loss }}>fee: -{s.feePaid.toFixed(6)}</div>
              )}
            </motion.div>
          )
        })}

        {/* Final result card */}
        <motion.div whileHover={{ y: -3 }} style={{
          minWidth: 160, padding: '16px 16px', flexShrink: 0, color: '#fff',
          borderRadius: 12, background: GRADIENT, boxShadow: '0 12px 28px rgba(79,70,235,0.32)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Net Result</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(4)}%
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>on 1 unit</div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#fff', marginTop: 2 }}>{finalCapital.toFixed(6)}</div>
        </motion.div>
      </div>
    </div>
  )
}
