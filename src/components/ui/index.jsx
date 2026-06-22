/*
=================================================
FILE: src/components/ui/index.jsx

Purpose:
Yeh file UI primitives aur design tokens define karta hai: colors, buttons, cards, modal, badges etc.

Is file mein:
1. Design tokens `T`, `SHADOW`, `GRADIENT`
2. Reusable components: SectionTitle, AnimatedNumber, StatCard, Badge, Button, Input, Card, Modal, NotificationToast, Spinner, ProgressBar, Divider

Viva Explanation:
Yeh components small aur re-usable hain. Agar design change karna ho toh tokens (T) ko update karo aur UI automatically change ho jayega.
React concepts: controlled inputs, animation with framer-motion, useEffect for animation timing, useRef for preserving values
=================================================
*/

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// ─── Design tokens — centralized colors and tokens
export const T = {
  bg: '#F4F6FB', surface: '#EEF2F8', card: '#FFFFFF',
  border: 'rgba(15,23,42,0.10)',
  profit: '#059669', loss: '#DC2626', accent: '#2563EB',
  warning: '#D97706', purple: '#7C3AED', cyan: '#0891B2',
  text: '#0F172A', muted: '#64748B', pink: '#DB2777',
}

// Hinglish: `T` tokens central jagah pe colors store karte — agar theme change karna ho to yahin change karo.

// Soft elevation shadows for the light theme
export const SHADOW    = '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)'
export const SHADOW_LG = '0 12px 32px rgba(15,23,42,0.12)'

// Shared brand gradient (matches sidebar / header)
export const GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'

// Hinglish: GRADIENT shared visual accent hai — header/sidebar aur buttons me use hota.

// ─── Section title (colored bar + optional icon chip)
export function SectionTitle({ color = '#2563EB', icon, children, action, style }) {
  // Simple presentational component: left colored strip + optional icon + title + optional action
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18, ...style }}>
      <span style={{ width: 4, height: 18, borderRadius: 2, background: color }} />
      {icon && (
        <span style={{ width: 30, height: 30, borderRadius: 9, background: `${color}16`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      )}
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{children}</span>
      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </div>
  )
}
// Hinglish: SectionTitle ek chhota helper hai jo section ke upar title dikhata; koi state nahi rakhta.

// ─── Animated number counter — React + requestAnimationFrame example
export function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '', duration = 700 }) {
  // display holds the interpolated value shown to the user
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  // useEffect to animate on value change using requestAnimationFrame
  useEffect(() => {
    const start = prevRef.current
    const end = value
    const startTime = performance.now()
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      // ease-out cubic for smoothness
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(start + (end - start) * eased)
      if (t < 1) requestAnimationFrame(tick)
      else prevRef.current = end
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>
}
// Hinglish: AnimatedNumber requestAnimationFrame se value smoothly change kara deta — presentation-only.

// ─── Stat card — shows a label and a number, optional icon
export function StatCard({ label, value, sub, color = T.accent, icon, pulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: T.card, border: `1px solid ${color}22`, borderRadius: 12, padding: 20,
        boxShadow: pulse ? `0 8px 24px ${color}22` : SHADOW,
        animation: pulse ? 'pulse-glow-blue 2.5s infinite' : 'none',
      }}
      whileHover={{ borderColor: `${color}55`, y: -2, transition: { duration: 0.15 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.02em', fontFamily: 'JetBrains Mono' }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{sub}</div>}
        </div>
        {icon && (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 16 }}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
// Hinglish: StatCard chhota summary card hai — label/value dikhata aur optional icon.

// ─── Badge — small pill used for counts/status
export function Badge({ children, color = T.accent, glow = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      background: `${color}20`, color, border: `1px solid ${color}35`,
      boxShadow: glow ? `0 0 8px ${color}50` : 'none',
      letterSpacing: '0.05em',
    }}>
      {children}
    </span>
  )
}
// Hinglish: Badge small pill style component hai — status ya counts dikhane ke liye use hota.

// ─── ConfidenceBadge — small semantic badge
export function ConfidenceBadge({ level }) {
  const map = { HIGH: T.profit, MED: T.warning, LOW: T.loss }
  const color = map[level] || T.muted
  return <Badge color={color} glow={level === 'HIGH'}>{level}</Badge>
}
// Hinglish: ConfidenceBadge domain-specific label show karta (HIGH/MED/LOW).

// ─── StatusBadge — human readable status pill
export function StatusBadge({ status }) {
  const map = { profitable: T.profit, marginal: T.warning, eliminated: T.loss }
  const label = { profitable: '● Profitable', marginal: '● Marginal', eliminated: '● Eliminated' }
  return <Badge color={map[status] || T.muted}>{label[status] || status}</Badge>
}
// Hinglish: StatusBadge human-friendly status text dikhata (profitable/marginal/eliminated).

// ─── Button — reusable button with variants
export function Button({ children, variant = 'ghost', onClick, disabled, style, size = 'md' }) {
  const styles = {
    primary: { background: T.accent, color: '#fff', border: 'none' },
    ghost:   { background: 'rgba(15,23,42,0.04)', color: T.text, border: `1px solid ${T.border}` },
    danger:  { background: `${T.loss}18`, color: T.loss, border: `1px solid ${T.loss}35` },
    success: { background: `${T.profit}18`, color: T.profit, border: `1px solid ${T.profit}35` },
    accent:  { background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}35` },
  }
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 11 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  }
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        borderRadius: 8, fontFamily: 'Inter', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, transition: 'background 0.2s, box-shadow 0.2s',
        ...styles[variant], ...sizes[size], ...style,
      }}
    >
      {children}
    </motion.button>
  )
}
// Hinglish: Button reusable UI primitive hai with variants (primary/ghost/danger...).

// ─── Input — controlled or uncontrolled input wrapper with label
export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label style={{ fontSize: 10, color: T.muted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
      <input style={{
        width: '100%', background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 7, padding: '9px 13px', color: T.text, fontSize: 13,
        fontFamily: 'Inter', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
        onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 2px ${T.accent}25` }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
        {...props}
      />
    </div>
  )
}
// Hinglish: Input ek thin wrapper hai native input ka — focus/blur pe styling apply karta.

// ─── Section header — title + optional sub + action
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}
// Hinglish: SectionHeader page-level grouping ke liye, title + optional sub + action.

// ─── Card — general purpose surface with hover effect
export function Card({ children, style, hover = true, glowColor }) {
  return (
    <motion.div
      style={{
        background: T.card, border: `1px solid ${glowColor ? `${glowColor}30` : T.border}`,
        borderRadius: 12, padding: 20, boxShadow: glowColor ? `0 8px 28px ${glowColor}1f` : SHADOW,
        ...style,
      }}
      whileHover={hover ? { borderColor: glowColor ? `${glowColor}60` : 'rgba(59,130,246,0.25)', y: -1, transition: { duration: 0.15 } } : {}}
    >
      {children}
    </motion.div>
  )
}
// Hinglish: Card ek reusable container hai — shadow/hover behavior centralized.

// ─── Empty state — shown when page has no data
export function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: T.muted }}>
      <div style={{ fontSize: 48, marginBottom: 16, filter: 'grayscale(0.3)' }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 20px' }}>{body}</div>
      {action}
    </div>
  )
}
// Hinglish: EmptyState jab data na ho to UI friendly message show karta.

// ─── Notification toast — list of toasts anchored bottom-right
export function NotificationToast({ notifications, onDismiss }) {
  const colorMap = { success: T.profit, info: T.accent, profit: T.profit, loss: T.loss, warn: T.warning }
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            style={{
              background: T.card, border: `1px solid ${colorMap[n.type] || T.accent}40`,
              borderRadius: 10, padding: '10px 14px', minWidth: 240, maxWidth: 320,
              boxShadow: `0 10px 30px rgba(15,23,42,0.15), 0 0 0 1px ${colorMap[n.type] || T.accent}20`,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}
            onClick={() => onDismiss(n.id)}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colorMap[n.type] || T.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.text }}>{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
// Hinglish: NotificationToast bottom-right anchored list of notifications — onDismiss handler se remove hota.

// ─── Loading spinner — small CSS spinner
export function Spinner({ size = 20, color = T.accent }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}
// Hinglish: Spinner chhota visual loader — CSS animation se ghoomta.

// ─── Modal — overlay modal using framer-motion for enter/exit
export function Modal({ open, onClose, title, children, width = 440 }) {
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, width, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: SHADOW_LG }}
        >
          {title && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', padding: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
              </button>
            </div>
          )}
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
// Hinglish: Modal overlay ke click pe close ho jaata (onClose), content ke andar click event stopPropagation karta hai.

// ─── Progress bar — visual progress indicator
export function ProgressBar({ value, max = 100, color = T.accent, height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ height, background: 'rgba(15,23,42,0.08)', borderRadius: height }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: height }}
      />
    </div>
  )
}
// Hinglish: ProgressBar percentage calculate karke animated div fill karta.

// ─── Divider — simple horizontal rule with optional label
export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  )
}
// Hinglish: Divider visual separator hai — optional label ke sath.
