/*
=================================================
FILE: src/pages/GraphExplorerPage.jsx

Purpose:
Graph Explorer visualizes the conversion graph between units.

Is file mein:
1. Graph rendering (nodes/edges)
2. Interactive exploration tools

Viva Explanation:
Graph page help karta hai conversions aur paths ko visualise karne mein.
=================================================
*/
import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, Panel } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities } from '../lib/algorithms'
import { Button, Badge, Card, T } from '../components/ui'
import { Icons } from '../components/layout'

// Custom node component for graph explorer
function GraphNode({ data }) {
  // Hinglish: data prop mein node ka saara rendering info aata hai (label, icon, color, etc.)
  // Hinglish: Yeh component sirf UI rendering karega — koi logic yahan change mat karna.
  const { label, icon, color, isArb, pathCount, category } = data
  return (
    <div style={{
      width: 84, height: 84, borderRadius: '50%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      background: `${color}15`,
      border: `2.5px solid ${isArb ? color : `${color}50`}`,
      boxShadow: isArb ? `0 0 22px ${color}45, inset 0 0 12px ${color}08` : 'none',
      animation: isArb ? 'pulse-glow-blue 2.2s infinite' : 'none',
      cursor: 'grab',
      transition: 'all 0.3s',
    }}>
      {/* Hinglish: Icon render karta hai — agar hataoge to symbol nahi dikhega */}
      <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{icon}</span>
      {/* Hinglish: Label dikhata; isArb true ho to color highlight milega */}
      <span style={{ fontSize: 10, fontWeight: 800, color: isArb ? color : T.text, fontFamily: 'JetBrains Mono' }}>{label}</span>
      {/* Hinglish: pathCount outgoing connections ka chhota indicator; delete karoge to count nahi dikhega */}
      <span style={{ fontSize: 8, color: T.muted }}>{pathCount}p</span>
    </div>
  )
}
// Hinglish: GraphNode ek custom renderer hai for node visuals — yahan se node ka look control hota.

const nodeTypes = { graph: GraphNode }

function buildGraphNodes(units, rates, unitMeta, arbUnits) {
  // Hinglish: buildGraphNodes units ko circular layout mein convert karta — positions calculate karte hue.
  // Hinglish: Agar units ki ginti badhegi to radius (r) adjust hota; agar is logic ko hataoge to layout collapse karega.
  const n = units.length
  return units.map((u, i) => {
    // Hinglish: meta agar missing ho to default icon/color use hota — defensive programming.
    const meta = unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }
    // Hinglish: angle calculate kar ke circular placement decide karte hain
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    // Hinglish: radius ko clamp kiya gaya hai so layout visually sane rahe
    const r = Math.min(260, Math.max(180, n * 32))
    // Hinglish: pathCount = kitne outgoing rates is unit se defined hain
    const pathCount = Object.values(rates[u] || {}).filter(Boolean).length
    return {
      id: u, type: 'graph',
      position: {
        x: 350 + r * Math.cos(angle) - 42,
        y: 260 + r * Math.sin(angle) - 42,
      },
      // Hinglish: data object mein UI ko dikhane wala saara info pass kar rahe
      data: { label: u, icon: meta.icon, color: meta.color, category: meta.category, isArb: arbUnits.has(u), pathCount },
    }
  })
}
// Hinglish: buildGraphNodes nodes ko circular layout mein place karta — agar layout logic change karo to positions change honge.

function buildGraphEdges(units, rates, arbPairs, filter) {
  // Hinglish: buildGraphEdges har possible pair ke liye edge banata agar rate defined ho.
  // Hinglish: arbPairs set mein jis pair ka key ho vo animated aur highlighted rahega.
  const edges = []
  for (const from of units) for (const to of units) {
    // Hinglish: self-edge skip karna — from === to wale cells ka koi sense nahi hota here
    if (from === to) continue
    // Hinglish: rate lookup — agar undefined to edge nahi banta
    const rate = rates[from]?.[to]
    if (!rate) continue
    const key = `${from}-${to}`
    // Hinglish: arbPairs se decide hota ki ye edge arbitrage path ka hissa hai ya nahi
    const isArb = arbPairs.has(key)
    // Hinglish: agar filter 'arb' hai to non-arb edges skip kar do
    if (filter === 'arb' && !isArb) continue
    edges.push({
      id: key, source: from, target: to, type: 'smoothstep',
      animated: isArb, // Hinglish: animated true ho to edge pulsing animation dikhata
      label: isArb ? `×${rate.toFixed(4)}` : '', // Hinglish: arbitrage edge par rate label dikhate
      style: { stroke: isArb ? T.profit : 'rgba(15,23,42,0.15)', strokeWidth: isArb ? 2.5 : 1, opacity: isArb ? 1 : 0.6 },
      labelStyle: { fill: T.profit, fontSize: 9, fontFamily: 'JetBrains Mono' },
      markerEnd: { type: 'arrowclosed', color: isArb ? T.profit : 'rgba(15,23,42,0.3)' },
    })
  }
  return edges
}
// Hinglish: buildGraphEdges edges create karta; agar filter === 'arb' to sirf arbitrage edges show honge.

export default function GraphExplorerPage() {
  // Hinglish: store se units, rates, unitMeta aur fees le rahe — graph banane ke liye zaroori data.
  const { units, rates, unitMeta, fees } = useAppStore()
  // Hinglish: filter state decide karta ki sab edges dikhane hain ya sirf arbitrage edges (all | arb)
  const [filter, setFilter] = useState('all')    // all | arb
  // Hinglish: search input store karta hai (client-side filtering)
  const [search, setSearch] = useState('')

  // Hinglish: opportunities compute kar raha hai using algorithm — expensive, isliye useMemo
  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])

  // Hinglish: arbPairs set mein har adjacent pair ka key add kar rahe (from-to) for highlighting edges
  const arbPairs = useMemo(() => {
    const set = new Set()
    for (const o of opportunities)
      for (let i = 0; i < o.path.length - 1; i++)
        set.add(`${o.path[i]}-${o.path[i + 1]}`)
    return set
  }, [opportunities])

  // Hinglish: arbUnits set mein woh units (nodes) add kar rahe jo kisi arbitrage path mein aate hain
  const arbUnits = useMemo(() => {
    const set = new Set()
    for (const o of opportunities) o.path.forEach(p => set.add(p))
    return set
  }, [opportunities])

  // Hinglish: client-side search filter for units list (case-insensitive)
  const filteredUnits = useMemo(() =>
    units.filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [units, search]
  )

  // Hinglish: initial nodes/edges calculate kar ke React Flow ke state hooks mein pass karenge
  const initNodes = useMemo(() => buildGraphNodes(filteredUnits, rates, unitMeta, arbUnits), [filteredUnits, rates, unitMeta, arbUnits])
  const initEdges = useMemo(() => buildGraphEdges(filteredUnits, rates, arbPairs, filter), [filteredUnits, rates, arbPairs, filter])

  // Hinglish: useNodesState/useEdgesState come from React Flow — yeh nodes/edges ko controlled state banate
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  // Hinglish: jab filteredUnits, rates, filter etc change karein to local nodes/edges update karna zaroori hai
  useEffect(() => {
    setNodes(buildGraphNodes(filteredUnits, rates, unitMeta, arbUnits))
    setEdges(buildGraphEdges(filteredUnits, rates, arbPairs, filter))
  }, [filteredUnits, rates, unitMeta, arbUnits, arbPairs, filter])

  // Hinglish: React Flow ke nodes/edges ko sync kar rahe — jab units/rates/filter change honge to graph update ho jayega.

  // Hinglish: quick stats for header display (node/edge counts)
  const stats = {
    nodes: filteredUnits.length,
    edges: edges.length,
    arbEdges: edges.filter(e => e.animated).length,
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Controls */}
      {/* Hinglish: upar ka controls row — search, filter buttons aur stats */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Hinglish: search input — client-side filtering for units */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter units…"
            style={{ background: 'none', border: 'none', color: T.text, fontSize: 12, outline: 'none', width: 130 }} />
        </div>

        {/* Hinglish: filter buttons toggle karte between all paths and arb-only */}
        {[['all','All Paths'], ['arb','Arb Only']].map(([v, l]) => (
          <Button key={v} variant={filter === v ? 'accent' : 'ghost'} size="sm" onClick={() => setFilter(v)}>{l}</Button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Hinglish: small stats showing node/edge counts */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.muted }}>
          <span>Nodes: <span style={{ color: T.text }}>{stats.nodes}</span></span>
          <span>Edges: <span style={{ color: T.text }}>{stats.edges}</span></span>
          <span>Arb edges: <span style={{ color: T.profit }}>{stats.arbEdges}</span></span>
        </div>

        {/* Hinglish: legend for line styles */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span><span style={{ color: T.profit }}>━ </span>Arbitrage path</span>
          <span><span style={{ color: 'rgba(15,23,42,0.3)' }}>━ </span>Conversion</span>
        </div>
      </div>

      {/* Graph */}
      {/* Hinglish: main ReactFlow canvas — nodes + edges render hoti hain yahan */}
      <div style={{ height: 520, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2} maxZoom={3}
          style={{ background: T.bg }}
          deleteKeyCode={null}
        >
          {/* Hinglish: Background grid for visual reference */}
          <Background color={T.border} gap={28} size={1} />
          {/* Hinglish: zoom/pan controls */}
          <Controls />
          {/* Hinglish: minimap shows small preview of graph, nodeColor chooses color for nodes */}
          <MiniMap
            nodeColor={n => n.data?.color || T.accent}
            maskColor="rgba(244,246,251,0.6)"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          />
          {/* Hinglish: small panel hint */}
          <Panel position="top-right" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: T.muted }}>
            Drag nodes to rearrange
          </Panel>
        </ReactFlow>
      </div>

      {/* Legend: units */}
      {/* Hinglish: Under the graph show kar rahe unit legend — color/icon/category + arb indicator */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filteredUnits.map(u => {
          // Hinglish: unit meta (icon/color/category) le rahe; default agar absent ho
          const meta = unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }
          // Hinglish: isArb agar true hai to unit kisi arbitrage path ka hissa hai
          const isArb = arbUnits.has(u)
          return (
            <div key={u} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              background: `${meta.color}10`, border: `1px solid ${meta.color}${isArb ? '50' : '25'}`,
              borderRadius: 20, fontSize: 11,
              boxShadow: isArb ? `0 0 8px ${meta.color}25` : 'none',
            }}>
              {/* Hinglish: icon + name + category display */}
              <span style={{ color: meta.color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{meta.icon}</span>
              <span style={{ fontWeight: 700, color: meta.color }}>{u}</span>
              <span style={{ color: T.muted }}>{meta.category}</span>
              {/* Hinglish: if unit is part of an arb path then zap icon show karo */}
              {isArb && <span style={{ color: T.profit, display: 'flex' }}><Icons.Zap /></span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}