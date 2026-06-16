import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import useAppStore from '../store/useAppStore'
import { computeArbitrageOpportunities, countActivePaths } from '../lib/algorithms'
import { StatCard, Card, Badge, EmptyState, T } from '../components/ui'

const CHART_COLORS = [T.accent, T.profit, T.warning, T.purple, T.cyan, T.pink, T.loss]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ color: T.muted, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, fontFamily: 'JetBrains Mono' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  )
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function AnalyticsPage() {
  const { units, rates, fees, unitMeta, simHistory } = useAppStore()

  const opps       = useMemo(() => computeArbitrageOpportunities(units, rates, fees), [units, rates, fees])
  const activePaths = useMemo(() => countActivePaths(units, rates), [units, rates])
  const avgProfit  = opps.length ? opps.reduce((a, b) => a + b.grossProfitPct, 0) / opps.length : 0
  const bestOpp    = opps[0]

  // Profit distribution by loop
  const profitBarData = useMemo(() =>
    opps.slice(0, 10).map((o, i) => ({
      name: `L${i + 1}`, gross: +o.grossProfitPct.toFixed(4),
      net: +o.netProfit.toFixed(4), fees: +o.feeImpact.toFixed(4),
      steps: o.steps,
    })), [opps])

  // By step count
  const byStep = useMemo(() => {
    const map = {}
    for (const o of opps) {
      if (!map[o.steps]) map[o.steps] = { steps: o.steps, count: 0, totalProfit: 0 }
      map[o.steps].count++
      map[o.steps].totalProfit += o.grossProfitPct
    }
    return Object.values(map).map(d => ({ ...d, avgProfit: +(d.totalProfit / d.count).toFixed(4) }))
  }, [opps])

  // Risk pie
  const riskPie = useMemo(() => {
    const low  = opps.filter(o => o.risk <= 33).length
    const med  = opps.filter(o => o.risk > 33 && o.risk <= 66).length
    const high = opps.filter(o => o.risk > 66).length
    return [
      { name: 'Low Risk',  value: low,  color: T.profit  },
      { name: 'Med Risk',  value: med,  color: T.warning },
      { name: 'High Risk', value: high, color: T.loss    },
    ].filter(d => d.value > 0)
  }, [opps])

  // Status pie
  const statusPie = useMemo(() => [
    { name: 'Profitable', value: opps.filter(o => o.status === 'profitable').length,  color: T.profit  },
    { name: 'Marginal',   value: opps.filter(o => o.status === 'marginal').length,    color: T.warning },
    { name: 'Eliminated', value: opps.filter(o => o.status === 'eliminated').length,  color: T.loss    },
  ].filter(d => d.value > 0), [opps])

  // Sim history area
  const simArea = useMemo(() =>
    simHistory.slice(-20).map((s, i) => ({
      run: `#${simHistory.length - 19 + i}`, roi: +s.roi.toFixed(4), profit: +s.netProfit?.toFixed?.(4),
    })), [simHistory])

  // Category breakdown
  const byCat = useMemo(() => {
    const map = {}
    for (const u of units) {
      const cat = unitMeta[u]?.category || 'Custom'
      map[cat] = (map[cat] || 0) + 1
    }
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [units, unitMeta])

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI row */}
      <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard label="Total Units"    value={units.length}           sub="Active nodes"         color={T.accent}  icon="⬡" />
        <StatCard label="Active Paths"   value={activePaths}            sub="Directed edges"       color={T.cyan}    icon="⟶" />
        <StatCard label="Arb Loops"      value={opps.length}            sub="Detected cycles"      color={T.profit}  icon="⚡" />
        <StatCard label="Avg Gross ROI"  value={`+${avgProfit.toFixed(3)}%`} sub="Per opportunity" color={T.warning} icon="%" />
        <StatCard label="Simulations"    value={simHistory.length}      sub="Total runs"           color={T.purple}  icon="▶" />
      </motion.div>

      {/* Main charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Gross vs Net profit bar */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Gross vs Net Profit by Loop</div>
            {profitBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={profitBarData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: T.muted }} />
                  <Bar dataKey="gross" name="Gross %" fill={T.accent} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="net"   name="Net %"   fill={T.profit} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fees"  name="Fee %"   fill={T.loss}   radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="📊" title="No data yet" body="Add rates and detect arbitrage loops." />
            )}
          </Card>
        </motion.div>

        {/* Profit by step count */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Avg Profit by Cycle Length</div>
            {byStep.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byStep}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="steps" tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Swaps', position: 'insideBottom', fill: T.muted, fontSize: 10, offset: -2 }} />
                  <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgProfit" name="Avg Profit %" radius={[4, 4, 0, 0]}>
                    {byStep.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="📉" title="No loop data" body="Adjust rates to generate arbitrage cycles." />
            )}
          </Card>
        </motion.div>
      </div>

      {/* Pie charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Risk distribution */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Risk Distribution</div>
            {riskPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={riskPie} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {riskPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState icon="⚠" title="No data" body="" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {riskPie.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    <span style={{ color: T.muted }}>{d.name}</span>
                  </span>
                  <span style={{ color: d.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Status pie */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Opportunity Status</div>
            {statusPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState icon="📊" title="No data" body="" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {statusPie.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    <span style={{ color: T.muted }}>{d.name}</span>
                  </span>
                  <span style={{ color: d.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Category breakdown */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Units by Category</div>
            {byCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byCat} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {byCat.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState icon="⬡" title="No data" body="" />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
              {byCat.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    <span style={{ color: T.muted }}>{d.name}</span>
                  </span>
                  <span style={{ color: d.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Simulation history area chart */}
      {simArea.length > 1 && (
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Simulation ROI History</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={simArea}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={T.profit} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.profit} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="run" tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: T.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="roi" name="ROI %" stroke={T.profit} fill="url(#roiGrad)" strokeWidth={2} dot={{ fill: T.profit, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Sim history table */}
      {simHistory.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Simulation Log ({simHistory.length} runs)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Loop', 'Initial', 'Final', 'Profit', 'ROI', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simHistory.slice().reverse().slice(0, 12).map((s, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 12px', fontSize: 11, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{simHistory.length - i}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, color: T.text, borderBottom: `1px solid ${T.border}`, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.loop}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'JetBrains Mono', borderBottom: `1px solid ${T.border}` }}>{s.initial?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—'}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'JetBrains Mono', color: s.roi >= 0 ? T.profit : T.loss, borderBottom: `1px solid ${T.border}` }}>{s.final?.toFixed?.(4) || '—'}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'JetBrains Mono', color: s.roi >= 0 ? T.profit : T.loss, borderBottom: `1px solid ${T.border}` }}>{s.profit >= 0 ? '+' : ''}{s.profit?.toFixed?.(4) || '—'}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600, color: s.roi >= 0 ? T.profit : T.loss, borderBottom: `1px solid ${T.border}` }}>{s.roi >= 0 ? '+' : ''}{s.roi?.toFixed?.(4) || '—'}%</td>
                      <td style={{ padding: '9px 12px', fontSize: 10, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{s.ts ? new Date(s.ts).toLocaleTimeString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
