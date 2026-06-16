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
      <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color: isArb ? color : T.text, fontFamily: 'JetBrains Mono' }}>{label}</span>
      <span style={{ fontSize: 8, color: T.muted }}>{pathCount}p</span>
    </div>
  )
}

const nodeTypes = { graph: GraphNode }

function buildGraphNodes(units, rates, unitMeta, arbUnits) {
  const n = units.length
  return units.map((u, i) => {
    const meta = unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const r = Math.min(260, Math.max(180, n * 32))
    const pathCount = Object.values(rates[u] || {}).filter(Boolean).length
    return {
      id: u, type: 'graph',
      position: {
        x: 350 + r * Math.cos(angle) - 42,
        y: 260 + r * Math.sin(angle) - 42,
      },
      data: { label: u, icon: meta.icon, color: meta.color, category: meta.category, isArb: arbUnits.has(u), pathCount },
    }
  })
}

function buildGraphEdges(units, rates, arbPairs, filter) {
  const edges = []
  for (const from of units) for (const to of units) {
    if (from === to) continue
    const rate = rates[from]?.[to]
    if (!rate) continue
    const key = `${from}-${to}`
    const isArb = arbPairs.has(key)
    if (filter === 'arb' && !isArb) continue
    edges.push({
      id: key, source: from, target: to, type: 'smoothstep',
      animated: isArb,
      label: isArb ? `×${rate.toFixed(4)}` : '',
      style: { stroke: isArb ? T.profit : 'rgba(15,23,42,0.15)', strokeWidth: isArb ? 2.5 : 1, opacity: isArb ? 1 : 0.6 },
      labelStyle: { fill: T.profit, fontSize: 9, fontFamily: 'JetBrains Mono' },
      markerEnd: { type: 'arrowclosed', color: isArb ? T.profit : 'rgba(15,23,42,0.3)' },
    })
  }
  return edges
}

export default function GraphExplorerPage() {
  const { units, rates, unitMeta, fees } = useAppStore()
  const [filter, setFilter] = useState('all')    // all | arb
  const [search, setSearch] = useState('')

  const opportunities = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])

  const arbPairs = useMemo(() => {
    const set = new Set()
    for (const o of opportunities)
      for (let i = 0; i < o.path.length - 1; i++)
        set.add(`${o.path[i]}-${o.path[i + 1]}`)
    return set
  }, [opportunities])

  const arbUnits = useMemo(() => {
    const set = new Set()
    for (const o of opportunities) o.path.forEach(p => set.add(p))
    return set
  }, [opportunities])

  const filteredUnits = useMemo(() =>
    units.filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [units, search]
  )

  const initNodes = useMemo(() => buildGraphNodes(filteredUnits, rates, unitMeta, arbUnits), [filteredUnits, rates, unitMeta, arbUnits])
  const initEdges = useMemo(() => buildGraphEdges(filteredUnits, rates, arbPairs, filter), [filteredUnits, rates, arbPairs, filter])

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  useEffect(() => {
    setNodes(buildGraphNodes(filteredUnits, rates, unitMeta, arbUnits))
    setEdges(buildGraphEdges(filteredUnits, rates, arbPairs, filter))
  }, [filteredUnits, rates, unitMeta, arbUnits, arbPairs, filter])

  const stats = {
    nodes: filteredUnits.length,
    edges: edges.length,
    arbEdges: edges.filter(e => e.animated).length,
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter units…"
            style={{ background: 'none', border: 'none', color: T.text, fontSize: 12, outline: 'none', width: 130 }} />
        </div>
        {[['all','All Paths'], ['arb','Arb Only']].map(([v, l]) => (
          <Button key={v} variant={filter === v ? 'accent' : 'ghost'} size="sm" onClick={() => setFilter(v)}>{l}</Button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.muted }}>
          <span>Nodes: <span style={{ color: T.text }}>{stats.nodes}</span></span>
          <span>Edges: <span style={{ color: T.text }}>{stats.edges}</span></span>
          <span>Arb edges: <span style={{ color: T.profit }}>{stats.arbEdges}</span></span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
          <span><span style={{ color: T.profit }}>━ </span>Arbitrage path</span>
          <span><span style={{ color: 'rgba(15,23,42,0.3)' }}>━ </span>Conversion</span>
        </div>
      </div>

      {/* Graph */}
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
          <Background color={T.border} gap={28} size={1} />
          <Controls />
          <MiniMap
            nodeColor={n => n.data?.color || T.accent}
            maskColor="rgba(244,246,251,0.6)"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          />
          <Panel position="top-right" style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: T.muted }}>
            Drag nodes to rearrange
          </Panel>
        </ReactFlow>
      </div>

      {/* Legend: units */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filteredUnits.map(u => {
          const meta = unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }
          const isArb = arbUnits.has(u)
          return (
            <div key={u} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              background: `${meta.color}10`, border: `1px solid ${meta.color}${isArb ? '50' : '25'}`,
              borderRadius: 20, fontSize: 11,
              boxShadow: isArb ? `0 0 8px ${meta.color}25` : 'none',
            }}>
              <span style={{ color: meta.color, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{meta.icon}</span>
              <span style={{ fontWeight: 700, color: meta.color }}>{u}</span>
              <span style={{ color: T.muted }}>{meta.category}</span>
              {isArb && <span style={{ color: T.profit, display: 'flex' }}><Icons.Zap /></span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
