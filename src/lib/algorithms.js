/**
 * Bellman-Ford based arbitrage detection.
 *
 * Transforms rates with -ln(rate) and runs Bellman-Ford to detect negative cycles
 * which correspond to profitable arbitrage loops. Returns an array of raw cycles
 * (path + gross multiplier + profit) suitable for downstream simulation.
 *
 * Inputs:
 * - units: string[] - list of unit identifiers (e.g. ['USD','EUR'])
 * - rates: Record<string, Record<string, number>> - adjacency mapping of rates
 *
 * Returns: Array<{ path: string[], grossMultiplier: number, profitPct: number }>
 *
 * Edge cases:
 * - If rates are missing for a pair the edge is ignored.
 * - Rates <= 0 are ignored.
 */
export function bellmanFord(units, rates) {
  const n = units.length
  if (n < 2) return []

  const idx = {}
  units.forEach((u, i) => (idx[u] = i))

  // Build edges: -ln(rate)
  const edges = []
  for (const [from, toMap] of Object.entries(rates)) {
    for (const [to, rate] of Object.entries(toMap)) {
      if (rate > 0 && idx[from] !== undefined && idx[to] !== undefined) {
        edges.push({
          u: idx[from], v: idx[to],
          w: -Math.log(rate),
          fromName: from, toName: to, rate,
        })
      }
    }
  }

  // Standard Bellman-Ford relaxation
  const dist = Array(n).fill(0)
/*
=================================================
FILE: src/lib/algorithms.js

Purpose:
Yeh file core algorithmic logic rakhta hai: Bellman-Ford algorithm se arbitrage detect karna,
fees apply karke net profit estimate karna, matrix build karna aur helper utilities.

Is file mein:
1. bellmanFord - negative cycle detection using -ln(rate)
2. computeArbitrageOpportunities - fee simulation + scoring
3. simulateLoop - stepwise simulation of a single loop
4. buildMatrix, countActivePaths, fmt, heatColor - helpers

Viva Explanation:
Bellman-Ford graph algorithm negative cycles detect karta hai. Financial conversion rates ko log transform karte hain taaki multiplicative profits additive ban jayein: -ln(rate).
Agar negative cycle mile toh uska matlab product of rates > 1 => arbitrage.
React/Project role: Ye functions UI ke liye data prepare karte hain (ArbitragePage, Dashboard etc.).
=================================================
*/
  const prev = Array(n).fill(-1)

  for (let i = 0; i < n - 1; i++) {
    let updated = false
    for (const e of edges) {
      if (dist[e.u] + e.w < dist[e.v] - 1e-12) {
        dist[e.v] = dist[e.u] + e.w
        prev[e.v] = e.u
  // Map unit string to index number for building numeric graph
  // Agar yeh mapping nahi hua toh edges create karne mein problem aayegi
        updated = true
      }
    }
    if (!updated) break
  }

  // Detect negative cycles
  const cycles = []
  const visitedStart = new Set()

  for (const e of edges) {
    if (dist[e.u] + e.w < dist[e.v] - 1e-12) {
      // Found a node in a negative cycle — trace back
      let node = e.v
  // Initialize distances and predecessors
  // Note: Using 0-init works because we only need to detect cycles (relative distances)
      if (visitedStart.has(node)) continue

      // Walk back n steps to guarantee we're IN the cycle
      for (let i = 0; i < n; i++) node = prev[node] ?? node

      const cyclePath = []
      const seen = new Set()
      let cur = node

      while (!seen.has(cur)) {
        seen.add(cur)
        cyclePath.unshift(units[cur])
        cur = prev[cur] ?? cur
        if (cyclePath.length > n + 2) break
      }
      cyclePath.push(cyclePath[0]) // close the loop
  // Detect negative cycles by checking for further relaxations

      if (cyclePath.length >= 3) {
        // Validate and compute actual profit
        let product = 1
        let valid = true
        for (let i = 0; i < cyclePath.length - 1; i++) {
      // Found a node in a negative cycle — trace back to get the cycle nodes
          const r = rates[cyclePath[i]]?.[cyclePath[i + 1]]
          if (!r || r <= 0) { valid = false; break }
          product *= r
        }
      // Walk back n steps to ensure the node is within the cycle
        if (valid && product > 1.0001) {
          visitedStart.add(e.v)
          cycles.push({
            path: cyclePath,
            grossMultiplier: product,
            profitPct: (product - 1) * 100,
          })
        }
      }
    }
  }

  return cycles
}

/**
 * Compute arbitrage opportunities with fees applied.
        // Validate the cycle has valid rates and compute product (gross multiplier)
 *
 * This wraps `bellmanFord`, then simulates the effect of fees (flat, pct, slippage)
 * to compute a net profit estimate, risk score and human-friendly metadata.
 *
 * Inputs:
 * - units: string[]
 * - rates: Record<string, Record<string, number>>
 * - fees: { flat: number, pct: number, slippage: number }
 *
 * Returns: Array of opportunity objects with fields:
 * { id, path, steps, grossProfitPct, netProfit, feeImpact, risk, confidence, status, stepDetails }
 */
export function computeArbitrageOpportunities(units, rates, fees = { flat: 0, pct: 0, slippage: 0 }) {
  const raw = bellmanFord(units, rates)

  return raw
    .map((c, id) => {
      const steps = c.path.length - 1

      // Simulate fee impact on $1 starting capital
      let capital = 1
      const stepDetails = []
      for (let i = 0; i < c.path.length - 1; i++) {
        const from = c.path[i], to = c.path[i + 1]
        const rate = rates[from]?.[to] || 1
        const before = capital
        const afterRate = capital * rate
        const afterSlippage = afterRate * (1 - fees.slippage / 100)
        const afterFlat = afterSlippage - fees.flat
        const afterPct = afterFlat * (1 - fees.pct / 100)
        stepDetails.push({ from, to, rate, before, after: afterPct, totalFee: before - afterPct })
        capital = afterPct
      }

      const netMultiplier = capital
      const netProfit = (netMultiplier - 1) * 100
      const feeImpact = c.profitPct - netProfit

      // Risk score: more steps + higher fees + marginal profit = higher risk
      const riskRaw = (steps * 8) + (feeImpact * 2) + (netProfit < 0.5 ? 30 : 0)
      const risk = Math.min(99, Math.max(1, Math.round(riskRaw)))

      const confidence =
        netProfit > 2 ? 'HIGH' :
        netProfit > 0.5 ? 'MED' : 'LOW'

      const status =
        netProfit > 0.5 ? 'profitable' :
        netProfit > 0   ? 'marginal' : 'eliminated'

      return {
        id, path: c.path, steps,
        grossProfitPct: c.profitPct,
        netProfit,
        feeImpact,
        risk, confidence, status,
        stepDetails,
        estFees: feeImpact,
      }
    })
    .filter(o => o.grossProfitPct > 0)
    .sort((a, b) => b.netProfit - a.netProfit)
}

/**
 * Simulate running a specific arbitrage loop with starting capital.
 *
 * Inputs:
 * - loop: { path: string[] }  (path must be closed: last element equals first)
 * - initialAmount: number
 * - rates: adjacency map
 * - fees: { flat, pct, slippage }
 *
 * Returns: { steps: Array, finalCapital, netProfit, roi, initialAmount }
 */
export function simulateLoop(loop, initialAmount, rates, fees) {
  let capital = initialAmount
  const steps = []

  for (let i = 0; i < loop.path.length - 1; i++) {
    const from = loop.path[i], to = loop.path[i + 1]
    const rate = rates[from]?.[to] || 1
    const before = capital
    const afterRate = capital * rate
    const afterSlippage = afterRate * (1 - fees.slippage / 100)
    const afterFlat = afterSlippage - fees.flat
    const afterPct = afterFlat * (1 - fees.pct / 100)
    steps.push({
      step: i + 1, from, to, rate,
      capitalBefore: before,
      capitalAfter: afterPct,
      feePaid: before - afterPct,
      slippageLoss: afterRate - afterSlippage,
    })
    capital = afterPct
  }

  const netProfit = capital - initialAmount
  const roi = (netProfit / initialAmount) * 100

  return { steps, finalCapital: capital, netProfit, roi, initialAmount }
}

/**
 * Build adjacency matrix for display in the matrix page.
 * Returns a 2D array matching units order where each cell is { type, value }.
 */
export function buildMatrix(units, rates) {
  return units.map(from =>
    units.map(to => {
      if (from === to) return { type: 'self', value: 1 }
      const r = rates[from]?.[to]
      return r ? { type: 'rate', value: r } : { type: 'empty', value: null }
    })
  )
}

/**
 * Count the number of directed active paths (non-self and with a valid rate).
 */
export function countActivePaths(units, rates) {
  let count = 0
  for (const f of units)
    for (const t of units)
      if (f !== t && rates[f]?.[t]) count++
  return count
}

/**
 * Format a numeric value for display using a reasonable precision and suffixes.
 */
export function fmt(value, precision = 5) {
  if (value === null || value === undefined) return '—'
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (Math.abs(value) >= 1e3) return value.toFixed(2)
  return value.toFixed(precision)
}

/**
 * Return a rgba color string for a heatmap cell between min and max.
 */
export function heatColor(value, min, max) {
  if (value === null) return 'transparent'
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // blue (low) → neutral → green (high)
  if (t < 0.5) {
    const r = Math.round(59 + (17 - 59) * (t / 0.5))
    const g = Math.round(130 + (24 - 130) * (t / 0.5))
    const b = Math.round(246 + (73 - 246) * (t / 0.5))
    return `rgba(${r},${g},${b},0.18)`
  } else {
    const r = Math.round(17 + (0 - 17) * ((t - 0.5) / 0.5))
    const g = Math.round(24 + (230 - 24) * ((t - 0.5) / 0.5))
    const b = Math.round(73 + (118 - 73) * ((t - 0.5) / 0.5))
    return `rgba(${r},${g},${b},0.18)`
  }
}
