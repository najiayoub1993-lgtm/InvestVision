# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InvestVision is a long-term investment strategy dashboard with an AI advisor powered by the Claude API. Vanilla HTML/CSS/JS frontend (Chart.js + Plotly.js via CDN), Node.js/Express backend for serving static files and proxying Claude API requests.

## Running

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start    # http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-... npm run dev  # with --watch for auto-reload
```

Requires Node.js >= 18. The `ANTHROPIC_API_KEY` env var is required for the AI chat feature; the dashboard itself works without it.

## Architecture

**Backend:** `server.js` — Express server serving `public/` as static files. One API endpoint: `POST /api/chat` proxies to Claude API with conversation memory (in-memory Map, 1hr TTL). `GET /api/health` reports status.

**Frontend (no module system):** All JS loaded as `<script>` tags in `public/index.html` in dependency order. Every global must be defined by a script loaded earlier. Load order: data → utils → engines → components → chat → app.

**Global state:** `AppState` in `app.js` holds all shared state (investment amount, selected strategy, time horizon). Components read from `AppState` directly. Changing global inputs calls `refreshCurrentTab()` which re-renders the active component.

**Component pattern:** Each tab is a singleton object (e.g., `PortfolioComponent`, `RiskDashComponent`) with a `render()` method that writes innerHTML to a container div. Components manage their own Chart.js instances and must call `destroyChart()` before recreating to avoid memory leaks.

**Chat component:** `ChatComponent` in `public/js/components/chat.js` is a floating widget (not a tab). It collects the user's current portfolio context (`getCurrentAllocations()` + `RiskEngine.calculateAll()`) and sends it with each message to `/api/chat`, so Claude has full awareness of the user's dashboard state.

**Engines** (`public/js/engines/`) are pure calculation modules:
- `RiskEngine` — volatility, Sharpe/Sortino ratios, VaR, max drawdown, beta. All other modules depend on `RiskEngine.mean()` and `RiskEngine.stddev()`.
- `BacktestEngine` — historical backtesting with DCA support, returns year-by-year balances.
- `MonteCarloEngine` — 1000-run simulation using Gaussian random returns from historical mean/stddev.

**Data** (`public/js/data/`) is all embedded — no API calls for core functionality:
- `historical.js` — annual returns (%) for 10 asset classes + CPI, 2000–2025. Exports `HISTORICAL_RETURNS`, `ASSET_CLASSES`, `YEARS`, `START_YEAR`, `END_YEAR`.
- `strategies.js` — 7 strategy templates with allocation maps. Exports `STRATEGIES`, `getStrategy()`, `getStrategyReturn()`.
- `crises.js` — crisis metadata. Exports `CRISES`, `getCrisisYears()`.

**Key coupling:** Strategy allocations map asset class keys (e.g., `sp500`, `us_bonds`) to weights (0–1). These keys must match keys in `HISTORICAL_RETURNS`.

## Deployment

- **Render:** `render.yaml` is pre-configured. Set `ANTHROPIC_API_KEY` in Render's environment variables.
- **Docker:** `Dockerfile` included. Build and run with `docker build -t investvision . && docker run -e ANTHROPIC_API_KEY=... -p 3000:3000 investvision`
- Any Node.js host (Railway, Fly.io, Heroku) works — just set the env var and `npm start`.

## Conventions

- Charting: Chart.js for standard charts, Plotly.js for heatmaps.
- Styling: dark theme via CSS custom properties in `public/css/styles.css`. Color constants mirrored in `public/js/utils/charts.js` as `COLORS`.
- Currency formatting: use `formatCurrency()` from `charts.js`.
- Chart cleanup: always `destroyChart(oldInstance)` before creating new Chart.js instances.

## Updating Historical Data

Add the year's return percentage to every asset class object in `public/js/data/historical.js` (including `cpi`). The `YEARS`, `START_YEAR`, and `END_YEAR` constants derive automatically from the `sp500` returns keys.
