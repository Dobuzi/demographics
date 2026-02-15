# Stock Dashboard

Interactive stock dashboard that visualizes price performance, financial statements, and news for user-provided tickers.

## Quick Start

```bash
cd stock-dashboard
cp .env.example .env.local   # Add your API keys
npm install
npm run dev                  # Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Provider | Free Tier |
|----------|----------|----------|-----------|
| `ALPHA_VANTAGE_API_KEY` | Yes | [Alpha Vantage](https://www.alphavantage.co/support/#api-key) | 25 req/day |
| `FINNHUB_API_KEY` | Yes | [Finnhub](https://finnhub.io/register) | 60 req/min |

## Features

### 1. Ticker Management
- Comma-separated input with chip UI
- Client-side format validation + server-side symbol lookup
- Persisted to localStorage across sessions
- Default watchlist: AAPL, TSLA, BRK-B

### 2. Price Charts
- Candlestick and line chart modes (toggle per ticker)
- Range presets: 1W, 1M, 3M, 6M, 1Y, 5Y, MAX
- Volume overlay histogram
- Period and day change badges
- **Comparison mode**: normalizes multiple tickers to 100 at period start

### 3. Financial Statements
- Tabs: Income Statement / Balance Sheet / Cash Flow
- Annual and quarterly periods, configurable depth (4/8/12 periods)
- Sticky-header table with human-readable formatting (K/M/B/T)
- Key metrics panel: revenue growth, margins, EPS, FCF, D/E, current ratio

### 4. News Feed
- Filterable by ticker and time window (24h / 7d / 30d)
- Sentiment labels (Positive / Neutral / Negative) via keyword-based heuristic
- Near-duplicate headline deduplication (Jaccard similarity)
- Source attribution and external links

### 5. Dashboard UX
- Responsive: mobile, tablet, desktop
- Dark mode (default)
- Loading skeletons and error states with retry buttons
- `prefers-reduced-motion` support

## Architecture

```
stock-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── prices/route.ts      GET /api/prices?ticker=...&range=...
│   │   │   ├── financials/route.ts   GET /api/financials?ticker=...&type=...&period=...
│   │   │   ├── news/route.ts         GET /api/news?ticker=...&window=...
│   │   │   └── validate/route.ts     GET /api/validate?ticker=...
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── charts/        PriceChart, CompareChart
│   │   ├── financials/    FinancialTabs, FinancialTable, MetricsPanel
│   │   ├── news/          NewsList
│   │   ├── ticker/        TickerInput, QuickStats
│   │   ├── ui/            Skeleton, ErrorPanel
│   │   ├── Dashboard.tsx  Main layout orchestrator
│   │   └── Providers.tsx  React Query provider
│   ├── lib/
│   │   ├── providers/     API adapter layer (swappable)
│   │   │   ├── alpha-vantage-price.ts
│   │   │   ├── alpha-vantage-financials.ts
│   │   │   ├── finnhub-news.ts
│   │   │   ├── fetch-utils.ts        Retry + backoff
│   │   │   └── index.ts              Provider registry
│   │   ├── transformers/  Data normalization + metric computation
│   │   ├── cache/         In-memory TTL cache
│   │   ├── sentiment/     Keyword-based sentiment analysis
│   │   └── hooks.ts       React Query hooks
│   └── types/             TypeScript interfaces
├── tests/                 Unit tests (tsx)
├── e2e/                   Playwright E2E tests
└── .env.example
```

## Design Decisions

### Chart Library: lightweight-charts (TradingView)
- Purpose-built for financial data (OHLC, volume, time series)
- Small bundle (~45KB gzipped) compared to ECharts (~300KB)
- Native candlestick support with professional appearance
- Canvas-based rendering for performance with large datasets

### Data Providers
- **Alpha Vantage** for prices and financials: single API key covers both endpoints, well-documented, supports all US equities including BRK-B
- **Finnhub** for news: generous free tier (60 calls/min), includes company-specific news with good coverage

### Adapter Pattern
All data providers implement typed interfaces (`PriceProvider`, `FinancialProvider`, `NewsProvider`). To swap a provider, create a new adapter and update `src/lib/providers/index.ts`.

### Sentiment Analysis
Local keyword-based heuristic with weighted word lists and negation handling. Designed to be swapped with an LLM-based or external API analyzer by implementing the same `{ sentiment, score }` interface.

### Caching Strategy
- Server-side in-memory TTL cache per endpoint type
- Prices: 5 min TTL (market hours)
- Financials: 24 hour TTL (quarterly updates)
- News: 15 min TTL
- Validation: 1 hour TTL
- Automatic eviction when cache exceeds 500 entries

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Limitations

- **Alpha Vantage free tier**: 25 requests/day. Heavy use will hit rate limits. Consider upgrading or implementing a local data cache.
- **BRK-B handling**: Alpha Vantage accepts the hyphenated form directly. Finnhub also supports it. No special transformation needed.
- **Sentiment accuracy**: The keyword-based approach is a rough heuristic. Consider integrating an LLM for production use.
- **No real-time data**: All data is fetched on-demand with caching. No WebSocket streaming.
- **Weekly data for 5Y/MAX**: Alpha Vantage weekly time series is used for longer ranges to avoid overwhelming the API.

## Sample Tickers

| Ticker | Type | Notes |
|--------|------|-------|
| AAPL | Normal US equity | Stable, well-covered |
| TSLA | High volatility | Large price swings, frequent news |
| BRK-B | Special character | Hyphenated ticker, tests edge case handling |
