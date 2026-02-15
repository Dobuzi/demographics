// ─── Price Data ───────────────────────────────────────────────
export interface OHLCData {
  date: string;       // ISO date string YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PricePoint {
  date: string;
  close: number;
  volume?: number;
}

export type PriceRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

export interface PriceResponse {
  ticker: string;
  data: OHLCData[];
  range: PriceRange;
  currency?: string;
  error?: string;
}

// ─── Financial Statements ─────────────────────────────────────
export type StatementType = 'income' | 'balance' | 'cashflow';
export type ReportingPeriod = 'annual' | 'quarterly';

export interface FinancialRow {
  label: string;
  values: (number | null)[];
}

export interface FinancialStatement {
  ticker: string;
  type: StatementType;
  period: ReportingPeriod;
  dates: string[];          // column headers (fiscal period end dates)
  rows: FinancialRow[];
  error?: string;
}

export interface KeyMetrics {
  revenueGrowthYoY: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  epsBasic: number | null;
  epsDiluted: number | null;
  freeCashFlow: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
}

// ─── News ─────────────────────────────────────────────────────
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type NewsWindow = '24h' | '7d' | '30d';

export interface NewsArticle {
  id: string;
  ticker: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: string;        // ISO datetime
  sentiment: Sentiment;
  sentimentScore: number;   // -1 to 1
}

export interface NewsResponse {
  ticker: string;
  articles: NewsArticle[];
  error?: string;
}

// ─── Provider Interface ───────────────────────────────────────
export interface PriceProvider {
  name: string;
  fetchPrices(ticker: string, range: PriceRange): Promise<PriceResponse>;
}

export interface FinancialProvider {
  name: string;
  fetchFinancials(
    ticker: string,
    type: StatementType,
    period: ReportingPeriod,
    limit?: number
  ): Promise<FinancialStatement>;
}

export interface NewsProvider {
  name: string;
  fetchNews(ticker: string, window: NewsWindow): Promise<NewsResponse>;
}

// ─── UI State ─────────────────────────────────────────────────
export interface TickerState {
  symbol: string;
  valid: boolean;
  loading: boolean;
}
