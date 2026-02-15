/**
 * Alpha Vantage financial statements provider.
 * Endpoints: INCOME_STATEMENT, BALANCE_SHEET, CASH_FLOW
 */

import {
  FinancialProvider,
  FinancialRow,
  FinancialStatement,
  ReportingPeriod,
  StatementType,
} from '@/types';
import { fetchWithRetry, ProviderError } from './fetch-utils';

const PROVIDER = 'AlphaVantage';
const BASE_URL = 'https://www.alphavantage.co/query';

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new ProviderError(PROVIDER, null, 'ALPHA_VANTAGE_API_KEY not set');
  return key;
}

const FUNCTION_MAP: Record<StatementType, string> = {
  income: 'INCOME_STATEMENT',
  balance: 'BALANCE_SHEET',
  cashflow: 'CASH_FLOW',
};

// Keys we want to extract from each statement type
const FIELD_MAP: Record<StatementType, { key: string; label: string }[]> = {
  income: [
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'costOfRevenue', label: 'Cost of Revenue' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'operatingIncome', label: 'Operating Income' },
    { key: 'sellingGeneralAndAdministrative', label: 'SG&A' },
    { key: 'researchAndDevelopment', label: 'R&D' },
    { key: 'interestExpense', label: 'Interest Expense' },
    { key: 'incomeBeforeTax', label: 'Income Before Tax' },
    { key: 'incomeTaxExpense', label: 'Income Tax Expense' },
    { key: 'netIncome', label: 'Net Income' },
    { key: 'ebit', label: 'EBIT' },
    { key: 'ebitda', label: 'EBITDA' },
  ],
  balance: [
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'totalCurrentAssets', label: 'Current Assets' },
    { key: 'cashAndCashEquivalentsAtCarryingValue', label: 'Cash & Equivalents' },
    { key: 'shortTermInvestments', label: 'Short Term Investments' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'totalLiabilities', label: 'Total Liabilities' },
    { key: 'totalCurrentLiabilities', label: 'Current Liabilities' },
    { key: 'longTermDebt', label: 'Long Term Debt' },
    { key: 'shortLongTermDebtTotal', label: 'Total Debt' },
    { key: 'totalShareholderEquity', label: 'Shareholder Equity' },
    { key: 'retainedEarnings', label: 'Retained Earnings' },
    { key: 'commonStockSharesOutstanding', label: 'Shares Outstanding' },
  ],
  cashflow: [
    { key: 'operatingCashflow', label: 'Operating Cash Flow' },
    { key: 'capitalExpenditures', label: 'Capital Expenditures' },
    { key: 'changeInOperatingLiabilities', label: 'Change in Operating Liabilities' },
    { key: 'changeInOperatingAssets', label: 'Change in Operating Assets' },
    { key: 'depreciationDepletionAndAmortization', label: 'Depreciation & Amortization' },
    { key: 'cashflowFromInvestment', label: 'Cash Flow from Investing' },
    { key: 'cashflowFromFinancing', label: 'Cash Flow from Financing' },
    { key: 'dividendPayout', label: 'Dividend Payout' },
    { key: 'netIncome', label: 'Net Income' },
  ],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseStatement(
  reports: any[],
  type: StatementType,
  limit: number
): { dates: string[]; rows: FinancialRow[] } {
  const trimmed = reports.slice(0, limit);
  const dates = trimmed.map((r) => r.fiscalDateEnding);
  const fields = FIELD_MAP[type];

  const rows: FinancialRow[] = fields.map(({ key, label }) => ({
    label,
    values: trimmed.map((r) => {
      const v = r[key];
      if (v === undefined || v === null || v === 'None') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    }),
  }));

  return { dates, rows };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const alphaVantageFinancials: FinancialProvider = {
  name: PROVIDER,

  async fetchFinancials(
    ticker: string,
    type: StatementType,
    period: ReportingPeriod,
    limit: number = 8
  ): Promise<FinancialStatement> {
    const fn = FUNCTION_MAP[type];
    const url = `${BASE_URL}?function=${fn}&symbol=${encodeURIComponent(ticker)}&apikey=${getApiKey()}`;

    const res = await fetchWithRetry(url, PROVIDER);
    const json = await res.json();

    if (json['Error Message']) {
      return { ticker, type, period, dates: [], rows: [], error: json['Error Message'] };
    }
    if (json['Note']) {
      return { ticker, type, period, dates: [], rows: [], error: 'Rate limit reached.' };
    }

    const reportKey = period === 'annual' ? 'annualReports' : 'quarterlyReports';
    const reports = json[reportKey];

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return {
        ticker,
        type,
        period,
        dates: [],
        rows: [],
        error: `No ${period} data available for ${ticker}`,
      };
    }

    const { dates, rows } = parseStatement(reports, type, limit);

    return { ticker, type, period, dates, rows };
  },
};
