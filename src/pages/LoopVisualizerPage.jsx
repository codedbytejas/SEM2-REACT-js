import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities } from '../lib/algorithms'
import { Button, Badge, ConfidenceBadge, Card, EmptyState, AnimatedNumber, T } from '../components/ui'

// Custom node for React Flow
function UnitNode({ data }) {
  const { label, icon, color, isActive, isPast, amount } = data
  return (
    <div style={{
      width: 90, height: 90, borderRadius: '50%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      background: isActive ? `${color}25` : isPast ? `${T.accent}12` : `${T.surface}`,
      border: `2.5px solid ${isActive ? color : isPast ? T.accent : T.border}`,
      boxShadow: isActive ? `0 0 28px ${color}50, 0 0 8px ${color}30` : 'none',
      transition: 'all 0.4s ease',
      animation: isActive ? 'pulse-glow-blue 1.5s infinite' : 'none',
      cursor: 'default',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
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
    const meta = unitMeta[name] || { icon: '🔷', color: T.accent }
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
      <EmptyState icon="🔄" title="No loop selected" body="Go to the Arbitrage Engine and click 'View Loop' on an opportunity, or ensure your Exchange Matrix has profitable cycles." action={<Button variant="accent" onClick={() => setPage('arbitrage')} size="sm">Arbitrage Engine</Button>} />
    </div>
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant={playing ? 'danger' : 'success'} onClick={play} size="sm">
          {playing ? '⏸ Pause' : step === -1 ? '▶ Play' : '▶ Resume'}
        </Button>
        <Button variant="ghost" onClick={reset} size="sm">↩ Reset</Button>
        <Button variant="ghost" onClick={() => setStep(s => Math.max(-1, s - 1))} size="sm" disabled={step < 0}>← Prev</Button>
        <Button variant="ghost" onClick={() => setStep(s => Math.min((loop?.steps || 0) - 1, s + 1))} size="sm" disabled={step >= (loop?.steps || 0) - 1}>Next →</Button>

        {opportunities.length > 1 && (
          <select
            onChange={e => { setSelectedLoop(opportunities[parseInt(e.target.value)]); reset() }}
            value={opportunities.findIndex(o => o.id === loop?.id)}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}
          >
            {opportunities.map((o, i) => (
              <option key={i} value={i}>Loop {i + 1}: {o.path.join(' → ')} (+{o.grossProfitPct.toFixed(3)}%)</option>
            ))}
          </select>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: T.muted }}>
          Step <span style={{ color: T.text, fontFamily: 'JetBrains Mono' }}>{step + 1}</span> of <span style={{ color: T.text, fontFamily: 'JetBrains Mono' }}>{loop.steps}</span>
        </div>
      </div>

      {/* React Flow graph */}
      <div style={{ height: 360, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
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
          <MiniMap nodeColor={n => n.data?.color || T.accent} maskColor="rgba(7,11,20,0.8)" />
        </ReactFlow>
      </div>

      {/* Step cards */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {stepData.map((s, i) => {
          const isActive = i === step
          const isPast = i < step
          return (
            <motion.div
              key={i}
              onClick={() => setStep(i)}
              style={{
                minWidth: 150, padding: 14, background: T.card, cursor: 'pointer',
                border: `1px solid ${isActive ? T.profit : isPast ? T.accent : T.border}`,
                borderRadius: 10, opacity: i > step + 1 ? 0.4 : 1,
                boxShadow: isActive ? `0 0 16px ${T.profit}20` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}
              whileHover={{ y: -2 }}
            >
              <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Step {i + 1}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{s.from} → {s.to}</div>
              <div style={{ fontSize: 10, color: T.muted }}>Rate</div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>×{s.rate.toFixed(5)}</div>
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
        <motion.div style={{
          minWidth: 150, padding: 14, background: `${T.profit}10`,
          border: `1px solid ${T.profit}40`, borderRadius: 10, flexShrink: 0,
          boxShadow: `0 0 20px ${T.profit}12`,
        }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net Result</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: roi >= 0 ? T.profit : T.loss, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(4)}%
          </div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>on 1 unit</div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: T.text, marginTop: 2 }}>{finalCapital.toFixed(6)}</div>
        </motion.div>
      </div>
    </div>
  )
}
