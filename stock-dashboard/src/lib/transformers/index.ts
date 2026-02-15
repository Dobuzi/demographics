/**
 * Data transformation and metric computation utilities.
 */

import { FinancialStatement, KeyMetrics, OHLCData } from '@/types';

// ─── Number formatting ───────────────────────────────────────

export function formatLargeNumber(n: number | null): string {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${abs.toFixed(2)}`;
}

export function formatPercent(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

export function formatCurrency(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toFixed(2)}`;
}

// ─── Price computations ──────────────────────────────────────

export function computePriceChange(data: OHLCData[]): {
  change: number;
  changePercent: number;
} {
  if (data.length < 2) return { change: 0, changePercent: 0 };
  const first = data[0].close;
  const last = data[data.length - 1].close;
  const change = last - first;
  const changePercent = first !== 0 ? change / first : 0;
  return {
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 10000) / 10000,
  };
}

export function computeDayChange(data: OHLCData[]): {
  change: number;
  changePercent: number;
} {
  if (data.length < 2) return { change: 0, changePercent: 0 };
  const prev = data[data.length - 2].close;
  const curr = data[data.length - 1].close;
  const change = curr - prev;
  const changePercent = prev !== 0 ? change / prev : 0;
  return {
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 10000) / 10000,
  };
}

/**
 * Normalize multiple price series to 100 at the start for comparison.
 */
export function normalizePriceSeries(
  series: { ticker: string; data: OHLCData[] }[]
): { ticker: string; data: { date: string; value: number }[] }[] {
  return series.map(({ ticker, data }) => {
    if (data.length === 0) return { ticker, data: [] };
    const base = data[0].close;
    return {
      ticker,
      data: data.map((d) => ({
        date: d.date,
        value: base !== 0 ? (d.close / base) * 100 : 0,
      })),
    };
  });
}

// ─── Financial metric computations ───────────────────────────

function findRowValue(statement: FinancialStatement, label: string, index: number): number | null {
  const row = statement.rows.find((r) => r.label === label);
  if (!row) return null;
  return row.values[index] ?? null;
}

/**
 * Compute key financial metrics from the most recent period of each statement.
 */
export function computeKeyMetrics(
  income: FinancialStatement | null,
  balance: FinancialStatement | null,
  cashflow: FinancialStatement | null
): KeyMetrics {
  const metrics: KeyMetrics = {
    revenueGrowthYoY: null,
    grossMargin: null,
    operatingMargin: null,
    netMargin: null,
    epsBasic: null,
    epsDiluted: null,
    freeCashFlow: null,
    debtToEquity: null,
    currentRatio: null,
  };

  if (income && income.rows.length > 0) {
    const rev0 = findRowValue(income, 'Total Revenue', 0);
    const rev1 = findRowValue(income, 'Total Revenue', 1);
    const gross = findRowValue(income, 'Gross Profit', 0);
    const opIncome = findRowValue(income, 'Operating Income', 0);
    const netIncome = findRowValue(income, 'Net Income', 0);

    if (rev0 !== null && rev1 !== null && rev1 !== 0) {
      metrics.revenueGrowthYoY = (rev0 - rev1) / Math.abs(rev1);
    }
    if (rev0 !== null && rev0 !== 0) {
      if (gross !== null) metrics.grossMargin = gross / rev0;
      if (opIncome !== null) metrics.operatingMargin = opIncome / rev0;
      if (netIncome !== null) metrics.netMargin = netIncome / rev0;
    }

    // EPS from net income / shares outstanding
    if (balance && netIncome !== null) {
      const shares = findRowValue(balance, 'Shares Outstanding', 0);
      if (shares !== null && shares !== 0) {
        metrics.epsBasic = netIncome / shares;
        metrics.epsDiluted = netIncome / shares; // simplified — same as basic without dilution data
      }
    }
  }

  if (balance && balance.rows.length > 0) {
    const totalDebt = findRowValue(balance, 'Total Debt', 0) ?? findRowValue(balance, 'Long Term Debt', 0);
    const equity = findRowValue(balance, 'Shareholder Equity', 0);
    const currentAssets = findRowValue(balance, 'Current Assets', 0);
    const currentLiabilities = findRowValue(balance, 'Current Liabilities', 0);

    if (totalDebt !== null && equity !== null && equity !== 0) {
      metrics.debtToEquity = totalDebt / Math.abs(equity);
    }
    if (currentAssets !== null && currentLiabilities !== null && currentLiabilities !== 0) {
      metrics.currentRatio = currentAssets / currentLiabilities;
    }
  }

  if (cashflow && cashflow.rows.length > 0) {
    const opCF = findRowValue(cashflow, 'Operating Cash Flow', 0);
    const capex = findRowValue(cashflow, 'Capital Expenditures', 0);

    if (opCF !== null) {
      // Capex is usually negative, but Alpha Vantage sometimes reports as positive
      const capexVal = capex !== null ? Math.abs(capex) : 0;
      metrics.freeCashFlow = opCF - capexVal;
    }
  }

  return metrics;
}
