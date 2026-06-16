## 1 Project Title

ArbMatrix — Visual Arbitrage Explorer and Simulator

## 2 Problem Statement

Decentralized and multi-exchange markets can contain transient price inconsistencies across trading pairs. Detecting and evaluating arbitrage cycles (loops of conversions that return more than the starting capital) in an exchange-rate matrix is non-trivial when transaction frictions (fees, slippage) are considered. The project aims to find, rank and simulate arbitrage opportunities from a matrix of pairwise exchange rates.

## 3 Objectives

- Provide a responsive UI to edit and view an exchange-rate matrix.
- Detect cyclical arbitrage opportunities using a numerical graph transformation and cycle-detection algorithm.
- Estimate the impact of transaction friction (flat fees, percentage fees, slippage) on raw arbitrage profit.
- Offer simulation and compounding on candidate loops to evaluate realistic returns.
- Present risk/confidence metrics and interactive visualization for exploration.

## 4 System Overview / Architecture

The project is a single-page React application scaffolded with Vite. Key parts:

- Frontend: `src/` — React components (pages, UI, matrix editor, simulator, analytics). Uses `framer-motion` for animations and `recharts` for charts.
- State: `src/store/useAppStore.js` — a small global store implemented with `zustand` that holds units, rates, fees, selected loop and current page.
- Algorithms: `src/lib/algorithms.js` — contains the graph transformation, Bellman-Ford-based arbitrage detection, fee simulation and utility helpers.
- Build: Vite (`package.json` scripts). Dependencies are listed in `package.json`.

Data flow:

1. User edits the exchange matrix in the Matrix page. The matrix maps currency/unit pairs to rates and stores them in the global store.
2. The Arbitrage page invokes `computeArbitrageOpportunities(units, rates, fees)` from `src/lib/algorithms.js` to compute candidate loops and metrics.
3. Users can view a loop, open the Loop visualizer, or run a simulation which uses `simulateLoop(...)` to produce step-by-step compounding results.

## 5 Data Structures and Algorithms Used

Data structures:

- Units: an array of strings (e.g., ["USD","BTC","ETH"]).
- Rates: a nested object mapping from unit -> toUnit -> numeric rate (adjacency map / list representation). Example: `{ USD: { BTC: 0.00003 }, BTC: { ETH: 12.5 } }`.
- Edges: a list of edge objects generated from the `rates` map containing source, destination and transformed weight.

Algorithms:

- Bellman-Ford negative-cycle detection (implemented in `bellmanFord` in `src/lib/algorithms.js`):
  - Rates are transformed via w = -ln(rate) so that multiplicative cycles with product > 1 map to negative-sum cycles. Running Bellman-Ford on this additive graph identifies negative cycles which correspond to arbitrage loops.
- Post-processing simulation (`computeArbitrageOpportunities` / `simulateLoop`):
  - Each candidate loop is validated against live rates, profited multiplier is computed, and fees/slippage are simulated step-by-step to produce net profit, fee impact, and a simple heuristic risk score.
- Utilities: adjacency matrix builder (`buildMatrix`), path counters and formatting helpers.

## 6 Implementation Approach

1. Represent the exchange graph as an adjacency map for fast lookups when simulating a loop.
2. Convert multiplicative rates to additive weights using `-Math.log(rate)` to detect profitable cycles using Bellman-Ford.
3. After finding raw cycles, validate each path and compute gross multiplier (product of rates) and profit percentage.
4. Simulate transaction frictions for a $1 starting capital across the loop to compute net multiplier and the fee impact.
5. Compute simple risk and confidence heuristics based on steps, fee impact and net profit.
6. Surface the results in the UI with sorting (by profit, risk, steps), interactive exploration, and a simulator for compounding.

Implementation notes:

- The code lives in `src/lib/algorithms.js`. The Arbitrage UI uses `computeArbitrageOpportunities` (see `src/pages/ArbitragePage.jsx`).
- UI components are small, presentational and live in `src/components` and nested folders.

## 7 Time and Space Complexity Analysis

Bellman-Ford (as used):
- Time complexity: O(V * E), where V = number of units and E = number of directed edges (active rates). In the dense worst case E = O(V^2) making worst-case time O(V^3). Practically, for small/medium matrices (dozens of units) this runs quickly in the browser.
- Space complexity: O(V + E) to store distance arrays, predecessor arrays and edge list.

Post-processing & simulation:
- Validating a found cycle and simulating fees takes O(k) time per cycle where k is cycle length (<= V). If C cycles are discovered, overhead is O(C * V).

Overall (detection + validate + simulate): O(V * E + C * V) time and O(V + E) space.

Edge cases and limits:
- Extremely large V (hundreds+) may make the browser CPU-bound. Consider server-side detection or pruning the graph.
- Rates that are zero/invalid are skipped; disconnected nodes are handled gracefully.

## 8 Execution Steps

Prerequisites: Node.js (16+ recommended) and npm.

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the port Vite reports). The app exposes pages for Matrix (edit rates), Arbitrage (detect and list loops), Loop visualizer and Simulator.

Automated screenshot capture (optional):

1. Install Playwright (locally) — the script below uses Playwright to open the dev server and capture screenshots:

```bash
npm install -D playwright
```

2. Run the dev server in one terminal and then capture screenshots in another:

```bash
npm run dev
node scripts/capture-screenshots.js http://localhost:5173
```

Captured images will be saved to `public/screenshots/` as `arbitrage-list.png` and `simulator.png`.

## 9 Sample Inputs and Outputs

Sample input (example units + rates):

```json
{
  "units": ["USD","BTC","ETH"],
  "rates": {
    "USD": { "BTC": 0.00003, "ETH": 0.0007 },
    "BTC": { "ETH": 12.5, "USD": 33000 },
    "ETH": { "USD": 1400, "BTC": 0.079 }
  },
  "fees": { "flat": 0.5, "pct": 0.2, "slippage": 0.05 }
}
```

Expected sample output (trimmed representation from `computeArbitrageOpportunities`):

```json
[
  {
    "id": 0,
    "path": ["USD","BTC","ETH","USD"],
    "steps": 3,
    "grossProfitPct": 2.3456,
    "netProfit": 1.1234,
    "feeImpact": 1.2222,
    "risk": 28,
    "confidence": "MED",
    "status": "profitable"
  }
]
```

The exact numbers depend on entered rates and fees. Use the Simulator page to step through compounding for a chosen loop.

## 10 Screenshots

Add screenshots to `public/screenshots/` (or a `docs/screenshots/` folder) and reference them here. Example markdown when you add images:

```markdown
![Arbitrage List](public/screenshots/arbitrage-list.svg)
![Simulator](public/screenshots/simulator.png)
```

Placeholders (please replace with actual images):

- `public/screenshots/arbitrage-list.png` — list of detected opportunities.
- `public/screenshots/simulator.png` — simulator step-by-step output.

## 11 Results and Observations

- The -ln(rate) transform combined with Bellman-Ford reliably identifies multiplicative arbitrage cycles as negative cycles.
- In practice, small gross profits are often eliminated once reasonable fees and slippage are applied; the project simulates fees per swap to show realistic net returns.
- The heuristic risk and confidence scores help triage which loops are worth further simulation.
- UX: interactive sorting and direct simulation helps explore edge cases quickly.

## 12 Conclusion

ArbMatrix demonstrates a compact, browser-based approach to detect and evaluate arbitrage cycles using a mathematically sound transform (logarithms) and the Bellman-Ford algorithm. The app complements raw detection with fee-aware simulations and simple risk heuristics to make findings actionable for further research or integration into execution pipelines. For larger graphs or production-grade automated execution, consider migrating heavy detection to a server-side process and integrating real-time market feeds.

---

Notes:

- For implementation details, see `src/lib/algorithms.js` and the Arbitrage page at `src/pages/ArbitragePage.jsx`.
- If you'd like, I can also add a `docs/` folder with example screenshots and a sample JSON input file for quick testing.
# ArbMatrix — Custom Unit & Currency Matrix Arbitrage Explorer

> B.Tech CSE Academic Case Study · Bellman-Ford Negative Cycle Detection

## Tech Stack
- **React 18** + **Vite 8**
- **Zustand** (state management + localStorage persistence)
- **Framer Motion** (animations & page transitions)  
- **@xyflow/react** (React Flow — Loop Visualizer & Graph Explorer)
- **Recharts** (Analytics charts)
- **Tailwind CSS** (via @tailwindcss/vite)

## Features
| Page | Feature |
|------|---------|
| Dashboard | KPI cards, profit distribution, best opportunity hero card |
| Exchange Matrix | Editable spreadsheet, heatmap overlay, keyboard nav, cell flash |
| Arbitrage Engine | Bellman-Ford detection, friction engine, confidence badges |
| Loop Visualizer | React Flow step-by-step animated loop walkthrough |
| Simulator | Principal compounder with fee/slippage breakdown |
| Graph Explorer | Force-directed React Flow graph, arb path highlighting |
| Custom Units | Preset library, unit cards, quick rate setter |
| Analytics | Recharts BarChart/PieChart/AreaChart dashboards |
| Settings | Precision, fees, import/export JSON, workspace reset |

## Algorithm
Bellman-Ford negative cycle detection with **−ln(rate)** edge transformation.  
A negative cycle in the weight graph = arbitrage opportunity.  
Complexity: **O(V·E)** per detection pass.

## Setup
```bash
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
```

## Folder Structure
```
src/
├── store/
│   └── useAppStore.js       # Zustand store (all state + actions)
├── lib/
│   └── algorithms.js        # Bellman-Ford, simulateLoop, helpers
├── components/
│   ├── ui/index.jsx         # Design system: Button, Card, Badge, Modal...
│   └── layout/index.jsx     # Sidebar, Header, TickerTape
└── pages/
    ├── DashboardPage.jsx
    ├── MatrixPage.jsx
    ├── ArbitragePage.jsx
    ├── LoopVisualizerPage.jsx
    ├── SimulatorPage.jsx
    ├── GraphExplorerPage.jsx
    ├── CustomUnitsPage.jsx
    ├── AnalyticsPage.jsx
    └── SettingsPage.jsx
```
