import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_UNITS = ['USD', 'EUR', 'GBP', 'BTC', 'ETH', 'JPY']

export const DEFAULT_RATES = {
  USD: { EUR: 0.9205, GBP: 0.7891, BTC: 0.0000237, ETH: 0.000378, JPY: 149.52 },
  EUR: { USD: 1.0863, GBP: 0.8570, BTC: 0.0000258, ETH: 0.000411, JPY: 162.44 },
  GBP: { USD: 1.2671, EUR: 1.1668, BTC: 0.0000301, ETH: 0.000480, JPY: 189.47 },
  BTC: { USD: 42100,  EUR: 38760,  GBP: 33240,     ETH: 15.92,   JPY: 6294880 },
  ETH: { USD: 2644,   EUR: 2432,   GBP: 2086,      BTC: 0.0628,  JPY: 395220  },
  JPY: { USD: 0.00669,EUR: 0.00616,GBP: 0.00528,   BTC: 0.000000159, ETH: 0.00000253 },
}

export const DEFAULT_UNIT_META = {
  USD: { icon: '$', color: '#16A34A', category: 'Fiat',   description: 'US Dollar' },
  EUR: { icon: '€', color: '#2563EB', category: 'Fiat',   description: 'Euro' },
  GBP: { icon: '£', color: '#7C3AED', category: 'Fiat',   description: 'British Pound' },
  BTC: { icon: '₿',  color: '#F59E0B', category: 'Crypto', description: 'Bitcoin' },
  ETH: { icon: 'Ξ',  color: '#06B6D4', category: 'Crypto', description: 'Ethereum' },
  JPY: { icon: '¥',  color: '#EC4899', category: 'Fiat',   description: 'Japanese Yen' },
}

const useAppStore = create(
  persist(
    (set, get) => ({
      units:         DEFAULT_UNITS,
      rates:         DEFAULT_RATES,
      unitMeta:      DEFAULT_UNIT_META,
      fees:          { flat: 0, pct: 0.1, slippage: 0.05 },
      precision:     5,
      simHistory:    [],
      notifications: [],
      selectedLoop:  null,
      activePage:    'dashboard',
      rateHistory:   {},

      setPage: (page) => set({ activePage: page }),

      addUnit: (name, meta) => {
        const { units, unitMeta } = get()
        const key = name.toUpperCase().trim()
        if (!key || units.includes(key)) return false
        set({ units: [...units, key], unitMeta: { ...unitMeta, [key]: meta } })
        get()._notify({ type: 'success', message: `Unit "${key}" created` })
        return true
      },

      removeUnit: (name) => {
        const { units, rates, unitMeta } = get()
        const newRates = { ...rates }
        delete newRates[name]
        for (const k in newRates) { const m = { ...newRates[k] }; delete m[name]; newRates[k] = m }
        const newMeta = { ...unitMeta }; delete newMeta[name]
        set({ units: units.filter(u => u !== name), rates: newRates, unitMeta: newMeta })
        get()._notify({ type: 'info', message: `"${name}" removed` })
      },

      updateUnitMeta: (name, meta) => {
        const { units, unitMeta } = get()
        const newUnits = units.includes(name) ? units : [...units, name]
        set({ units: newUnits, unitMeta: { ...unitMeta, [name]: { ...(unitMeta[name] || {}), ...meta } } })
      },

      setRate: (from, to, value) => {
        const { rates, rateHistory } = get()
        const key = `${from}-${to}`
        const prev = rates[from]?.[to]
        const hist = rateHistory[key] || []
        set({
          rates: { ...rates, [from]: { ...(rates[from] || {}), [to]: value } },
          rateHistory: { ...rateHistory, [key]: [...hist.slice(-49), { ts: Date.now(), value }] },
        })
        if (prev && Math.abs((value - prev) / prev) > 0.05) {
          get()._notify({
            type: value > prev ? 'profit' : 'loss',
            message: `${from}/${to} ${value > prev ? '▲' : '▼'} ${(Math.abs((value - prev) / prev) * 100).toFixed(2)}%`,
          })
        }
      },

      removeRate: (from, to) => {
        const { rates } = get()
        const newRates = { ...rates, [from]: { ...(rates[from] || {}) } }
        delete newRates[from][to]
        set({ rates: newRates })
      },

      setFees: (fees) => set({ fees }),
      setPrecision: (precision) => set({ precision }),

      addSimResult: (result) => {
        set(s => ({ simHistory: [...s.simHistory.slice(-99), { ...result, ts: Date.now() }] }))
      },
      clearSimHistory: () => set({ simHistory: [] }),

      setSelectedLoop: (loop) => set({ selectedLoop: loop }),

      _notify: (note) => {
        const id = Date.now() + Math.random()
        set(s => ({ notifications: [...s.notifications.slice(-4), { ...note, id }] }))
        setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 3500)
      },
      dismissNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      importWorkspace: (data) => {
        if (data.units)    set({ units: data.units })
        if (data.rates)    set({ rates: data.rates })
        if (data.unitMeta) set({ unitMeta: data.unitMeta })
        if (data.fees)     set({ fees: data.fees })
        get()._notify({ type: 'success', message: 'Workspace imported successfully' })
      },

      exportWorkspace: () => {
        const { units, rates, unitMeta, fees, precision } = get()
        const blob = new Blob([JSON.stringify({ units, rates, unitMeta, fees, precision }, null, 2)], { type: 'application/json' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
        a.download = `arbmatrix_${new Date().toISOString().slice(0, 10)}.json`; a.click()
        get()._notify({ type: 'success', message: 'Workspace exported' })
      },

      resetWorkspace: () => {
        set({ units: DEFAULT_UNITS, rates: DEFAULT_RATES, unitMeta: DEFAULT_UNIT_META,
          fees: { flat: 0, pct: 0.1, slippage: 0.05 }, simHistory: [], rateHistory: {} })
        get()._notify({ type: 'info', message: 'Workspace reset to defaults' })
      },
    }),
    {
      name: 'arbmatrix-v3',
      partialize: (s) => ({
        units: s.units, rates: s.rates, unitMeta: s.unitMeta,
        fees: s.fees, precision: s.precision, simHistory: s.simHistory, rateHistory: s.rateHistory,
      }),
    }
  )
)

export default useAppStore
