/**
 * Unit tests for data transformers.
 * Run: npx tsx tests/transformers.test.ts
 */

import assert from 'assert';
import {
  formatLargeNumber,
  formatPercent,
  formatCurrency,
  computePriceChange,
  computeDayChange,
  normalizePriceSeries,
  computeKeyMetrics,
} from '../src/lib/transformers';
import { OHLCData, FinancialStatement } from '../src/types';

// ─── formatLargeNumber ──────────────────────────────────────

assert.strictEqual(formatLargeNumber(null), '—');
assert.strictEqual(formatLargeNumber(1234567890), '1.23B');
assert.strictEqual(formatLargeNumber(1500000), '1.50M');
assert.strictEqual(formatLargeNumber(45000), '45.00K');
assert.strictEqual(formatLargeNumber(999), '999.00');
assert.strictEqual(formatLargeNumber(-5000000), '-5.00M');
assert.strictEqual(formatLargeNumber(1200000000000), '1.20T');
console.log('✓ formatLargeNumber');

// ─── formatPercent ──────────────────────────────────────────

assert.strictEqual(formatPercent(null), '—');
assert.strictEqual(formatPercent(0.1234), '12.34%');
assert.strictEqual(formatPercent(-0.05), '-5.00%');
assert.strictEqual(formatPercent(1), '100.00%');
console.log('✓ formatPercent');

// ─── formatCurrency ─────────────────────────────────────────

assert.strictEqual(formatCurrency(null), '—');
assert.strictEqual(formatCurrency(150.5), '$150.50');
assert.strictEqual(formatCurrency(0), '$0.00');
console.log('✓ formatCurrency');

// ─── computePriceChange ─────────────────────────────────────

const priceData: OHLCData[] = [
  { date: '2024-01-01', open: 100, high: 105, low: 98, close: 100, volume: 1000 },
  { date: '2024-01-02', open: 101, high: 106, low: 99, close: 102, volume: 1100 },
  { date: '2024-01-03', open: 102, high: 112, low: 101, close: 110, volume: 1200 },
];

const change = computePriceChange(priceData);
assert.strictEqual(change.change, 10);
assert.strictEqual(change.changePercent, 0.1);
console.log('✓ computePriceChange');

// ─── computeDayChange ───────────────────────────────────────

const dayChange = computeDayChange(priceData);
assert.strictEqual(dayChange.change, 8);
// 8 / 102 ≈ 0.0784
assert.ok(Math.abs(dayChange.changePercent - 0.0784) < 0.001);
console.log('✓ computeDayChange');

// ─── Edge case: empty data ──────────────────────────────────

const emptyChange = computePriceChange([]);
assert.strictEqual(emptyChange.change, 0);
assert.strictEqual(emptyChange.changePercent, 0);
console.log('✓ computePriceChange (empty)');

// ─── normalizePriceSeries ───────────────────────────────────

const series = normalizePriceSeries([
  {
    ticker: 'AAA',
    data: [
      { date: '2024-01-01', open: 50, high: 55, low: 48, close: 50, volume: 100 },
      { date: '2024-01-02', open: 52, high: 56, low: 50, close: 55, volume: 110 },
    ],
  },
  {
    ticker: 'BBB',
    data: [
      { date: '2024-01-01', open: 200, high: 210, low: 195, close: 200, volume: 500 },
      { date: '2024-01-02', open: 205, high: 215, low: 200, close: 220, volume: 600 },
    ],
  },
]);

assert.ok(Math.abs(series[0].data[0].value - 100) < 0.001);
assert.ok(Math.abs(series[0].data[1].value - 110) < 0.001); // 55/50 * 100
assert.ok(Math.abs(series[1].data[0].value - 100) < 0.001);
assert.ok(Math.abs(series[1].data[1].value - 110) < 0.001); // 220/200 * 100
console.log('✓ normalizePriceSeries');

// ─── computeKeyMetrics ──────────────────────────────────────

const incomeStmt: FinancialStatement = {
  ticker: 'TEST',
  type: 'income',
  period: 'annual',
  dates: ['2024-12-31', '2023-12-31'],
  rows: [
    { label: 'Total Revenue', values: [1200000000, 1000000000] },
    { label: 'Gross Profit', values: [480000000, 400000000] },
    { label: 'Operating Income', values: [240000000, 200000000] },
    { label: 'Net Income', values: [180000000, 150000000] },
  ],
};

const balanceStmt: FinancialStatement = {
  ticker: 'TEST',
  type: 'balance',
  period: 'annual',
  dates: ['2024-12-31'],
  rows: [
    { label: 'Total Debt', values: [500000000] },
    { label: 'Shareholder Equity', values: [800000000] },
    { label: 'Current Assets', values: [600000000] },
    { label: 'Current Liabilities', values: [300000000] },
    { label: 'Shares Outstanding', values: [100000000] },
  ],
};

const cashflowStmt: FinancialStatement = {
  ticker: 'TEST',
  type: 'cashflow',
  period: 'annual',
  dates: ['2024-12-31'],
  rows: [
    { label: 'Operating Cash Flow', values: [300000000] },
    { label: 'Capital Expenditures', values: [-80000000] },
  ],
};

const metrics = computeKeyMetrics(incomeStmt, balanceStmt, cashflowStmt);

// Revenue growth: (1.2B - 1B) / 1B = 0.2
assert.ok(Math.abs(metrics.revenueGrowthYoY! - 0.2) < 0.001);
// Gross margin: 480M / 1.2B = 0.4
assert.ok(Math.abs(metrics.grossMargin! - 0.4) < 0.001);
// Operating margin: 240M / 1.2B = 0.2
assert.ok(Math.abs(metrics.operatingMargin! - 0.2) < 0.001);
// Net margin: 180M / 1.2B = 0.15
assert.ok(Math.abs(metrics.netMargin! - 0.15) < 0.001);
// EPS: 180M / 100M = 1.8
assert.ok(Math.abs(metrics.epsBasic! - 1.8) < 0.001);
// D/E: 500M / 800M = 0.625
assert.ok(Math.abs(metrics.debtToEquity! - 0.625) < 0.001);
// Current ratio: 600M / 300M = 2.0
assert.ok(Math.abs(metrics.currentRatio! - 2.0) < 0.001);
// FCF: 300M - 80M = 220M
assert.ok(Math.abs(metrics.freeCashFlow! - 220000000) < 1);
console.log('✓ computeKeyMetrics');

// ─── computeKeyMetrics with nulls ───────────────────────────

const emptyMetrics = computeKeyMetrics(null, null, null);
assert.strictEqual(emptyMetrics.revenueGrowthYoY, null);
assert.strictEqual(emptyMetrics.grossMargin, null);
assert.strictEqual(emptyMetrics.freeCashFlow, null);
console.log('✓ computeKeyMetrics (null inputs)');

console.log('\nAll transformer tests passed!');
