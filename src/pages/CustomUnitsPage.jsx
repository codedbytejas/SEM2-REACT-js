/*
=================================================
FILE: src/pages/CustomUnitsPage.jsx

Purpose:
Custom Units page allows user to manage units (add/remove/update metadata).

Is file mein:
1. Forms to add new units
2. List of units with edit/delete actions

Viva Explanation:
User can create their own units and presets. Store actions used heavily here.
=================================================
*/
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../store/useAppStore'
import { Button, Card, Input, Modal, Badge, T } from '../components/ui'
import { Icons } from '../components/layout'

const PRESETS = [
  { name: 'GOLD',   icon: 'Au', color: '#D97706', category: 'Commodity' },
  { name: 'WOOD',   icon: 'Wd', color: '#92400E', category: 'Commodity' },
  { name: 'IRON',   icon: 'Fe', color: '#6B7280', category: 'Commodity' },
  { name: 'SILVER', icon: 'Ag', color: '#94A3B8', category: 'Commodity' },
  { name: 'ENERGY', icon: 'En', color: '#CA8A04', category: 'Resource'  },
  { name: 'WATER',  icon: 'Wa', color: '#0EA5E9', category: 'Resource'  },
  { name: 'FOOD',   icon: 'Fd', color: '#16A34A', category: 'Resource'  },
  { name: 'COFFEE', icon: 'Co', color: '#78350F', category: 'Token'     },
  { name: 'HOURS',  icon: 'Hr', color: '#7C3AED', category: 'Service'   },
  { name: 'DATA',   icon: 'Dt', color: '#0891B2', category: 'Digital'   },
  { name: 'CARBON', icon: 'Cb', color: '#16A34A', category: 'Credit'    },
  { name: 'STONE',  icon: 'St', color: '#78716C', category: 'Commodity' },
  { name: 'GEMS',   icon: 'Gm', color: '#DB2777', category: 'Rare'      },
  { name: 'TOKENS', icon: 'Tk', color: '#F97316', category: 'Token'     },
]

function UnitCard({ unit, meta, rates, onEdit, onRemove }) {
  const outbound = Object.values(rates[unit] || {}).filter(Boolean).length
  const inbound  = Object.keys(rates).filter(f => f !== unit && rates[f]?.[unit]).length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -3, borderColor: `${meta.color}55` }}
      style={{
        background: T.card, border: `1px solid ${meta.color}28`, borderRadius: 12,
        padding: 18, position: 'relative', transition: 'border-color 0.2s',
      }}
    >
      {/* Color strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.color, borderRadius: '12px 12px 0 0' }} />

      <div style={{ fontSize: 28, fontWeight: 800, color: meta.color, fontFamily: 'JetBrains Mono', marginBottom: 10, marginTop: 4, lineHeight: 1 }}>{meta.icon}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: meta.color, marginBottom: 3 }}>{unit}</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{meta.category}</div>
      {meta.description && <div style={{ fontSize: 10, color: T.muted, marginBottom: 10, lineHeight: 1.4 }}>{meta.description}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <Badge color={T.cyan}>{outbound} out</Badge>
        <Badge color={T.purple}>{inbound} in</Badge>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <Button variant="ghost" size="sm" onClick={() => onEdit(unit)} style={{ flex: 1, justifyContent: 'center' }}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => onRemove(unit)}>Remove</Button>
      </div>
    </motion.div>
  )
}
// Hinglish: UnitCard ek presentational card hai jo ek unit ka overview dikhata — edit/remove actions pass kiye gaye props se aate.

function QuickRateRow({ units, rates, onSetRate }) {
  const [from, setFrom] = useState(units[0] || '')
  const [to,   setTo]   = useState(units[1] || '')
  const [rate, setRate] = useState('')

  const sel = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 12, padding: '8px 10px', cursor: 'pointer', outline: 'none' }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>From</label>
        <select value={from} onChange={e => setFrom(e.target.value)} style={sel}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <span style={{ color: T.muted, fontSize: 18, paddingBottom: 6 }}>→</span>
      <div>
        <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>To</label>
        <select value={to} onChange={e => setTo(e.target.value)} style={sel}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rate</label>
        <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 1.25"
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 13, padding: '8px 12px', width: 110, outline: 'none', fontFamily: 'JetBrains Mono' }} />
      </div>
      <Button variant="primary" size="sm" onClick={() => {
        if (from !== to && rate && parseFloat(rate) > 0) {
          onSetRate(from, to, parseFloat(rate))
          setRate('')
        }
      }}>Set Rate</Button>
      {/* Hinglish: QuickRateRow simple helper hai jisse user jaldi se ek conversion rate set kar sakta. */}
    </div>
  )
}

export default function CustomUnitsPage() {
  const { units, unitMeta, rates, removeUnit, updateUnitMeta, setRate } = useAppStore()
  const [editUnit, setEditUnit] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [search, setSearch]     = useState('')
  const [catFilter, setCat]     = useState('All')

  const categories = ['All', ...new Set(units.map(u => unitMeta[u]?.category || 'Custom'))]
  const filtered = units.filter(u => {
    const meta = unitMeta[u] || {}
    const matchSearch = u.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || meta.category === catFilter
    return matchSearch && matchCat
  })

  // Hinglish: filtered array search aur category filter dono apply karke ban raha hai — pure front-end filtering.

  const openEdit = (name) => {
    const meta = unitMeta[name] || { icon: '•', color: T.accent, category: 'Custom', description: '' }
    setEditUnit(name)
    setEditForm({ ...meta })
  }

  const saveEdit = () => {
    if (editUnit) { updateUnitMeta(editUnit, editForm); setEditUnit(null) }
  }

  const addPreset = (p) => {
    if (!units.includes(p.name)) updateUnitMeta(p.name, { icon: p.icon, color: p.color, category: p.category, description: '' })
  }

  // Hinglish: addPreset pre-defined presets ko store mein daal deta — duplicate avoid karne ke liye units.includes check hai.

  return (
    <div style={{ padding: 24 }}>
      {/* Presets */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Quick-Add Presets
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PRESETS.map(p => {
            const exists = units.includes(p.name)
            return (
              <motion.div key={p.name} whileHover={!exists ? { scale: 1.05 } : {}}
                onClick={() => !exists && addPreset(p)}
                style={{
                  padding: '6px 12px', background: exists ? 'rgba(15,23,42,0.03)' : `${p.color}12`,
                  border: `1px ${exists ? 'solid' : 'dashed'} ${p.color}${exists ? '20' : '50'}`,
                  borderRadius: 8, cursor: exists ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  opacity: exists ? 0.4 : 1, fontSize: 12,
                }}
              >
                <span style={{ color: p.color, fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 11 }}>{p.icon}</span>
                <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: T.muted, fontSize: 10 }}>{p.category}</span>
                {exists && <span style={{ color: T.muted, display: 'flex' }}><Icons.Check /></span>}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quick rate setter */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Quick Set Conversion Rate
        </div>
        <QuickRateRow units={units} rates={rates} onSetRate={setRate} />
      </div>

      {/* Filters + grid */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search units…"
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, padding: '7px 12px', outline: 'none', width: 180 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {categories.map(c => (
            <Button key={c} variant={catFilter === c ? 'accent' : 'ghost'} size="sm" onClick={() => setCat(c)}>{c}</Button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: T.muted }}>{filtered.length} units</div>
      </div>

      <AnimatePresence>
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 14 }}>
          {filtered.map(u => (
            <UnitCard key={u} unit={u} meta={unitMeta[u] || { icon: '•', color: T.accent, category: 'Custom' }}
              rates={rates} onEdit={openEdit} onRemove={removeUnit} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Edit modal */}
      <Modal open={!!editUnit} onClose={() => setEditUnit(null)} title={`Edit Unit — ${editUnit}`} width={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Input label="Symbol" value={editForm.icon || ''} onChange={e => setEditForm(p => ({ ...p, icon: e.target.value }))} style={{ width: 90 }} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Color</label>
              <input type="color" value={editForm.color || '#3B82F6'} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                style={{ width: '100%', height: 38, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, cursor: 'pointer', padding: 3 }} />
            </div>
          </div>
          <Input label="Category" value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
          <Input label="Description" value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
          {/* Preview */}
          <div style={{ padding: '12px 16px', background: `${editForm.color || T.accent}12`, border: `1px solid ${editForm.color || T.accent}30`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{editForm.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: editForm.color || T.accent }}>{editUnit}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{editForm.category}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
            <Button variant="ghost" onClick={() => setEditUnit(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
