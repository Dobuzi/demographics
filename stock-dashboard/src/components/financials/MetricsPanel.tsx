'use client';

import { KeyMetrics } from '@/types';
import { formatPercent, formatLargeNumber } from '@/lib/transformers';

interface MetricsPanelProps {
  metrics: KeyMetrics;
  ticker: string;
}

interface MetricCardProps {
  label: string;
  value: string;
  positive?: boolean | null;
}

function MetricCard({ label, value, positive }: MetricCardProps) {
  const colorClass =
    positive === null || value === '—'
      ? 'text-zinc-300'
      : positive
        ? 'text-green-400'
        : 'text-red-400';

  return (
    <div className="rounded-lg bg-zinc-800/50 p-3">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`mt-1 text-sm font-semibold tabular-nums ${colorClass}`}>{value}</div>
    </div>
  );
}

export function MetricsPanel({ metrics, ticker }: MetricsPanelProps) {
  const items: { label: string; value: string; positive: boolean | null }[] = [
    {
      label: 'Revenue Growth (YoY)',
      value: formatPercent(metrics.revenueGrowthYoY),
      positive: metrics.revenueGrowthYoY !== null ? metrics.revenueGrowthYoY > 0 : null,
    },
    {
      label: 'Gross Margin',
      value: formatPercent(metrics.grossMargin),
      positive: metrics.grossMargin !== null ? metrics.grossMargin > 0.3 : null,
    },
    {
      label: 'Operating Margin',
      value: formatPercent(metrics.operatingMargin),
      positive: metrics.operatingMargin !== null ? metrics.operatingMargin > 0 : null,
    },
    {
      label: 'Net Margin',
      value: formatPercent(metrics.netMargin),
      positive: metrics.netMargin !== null ? metrics.netMargin > 0 : null,
    },
    {
      label: 'EPS (Basic)',
      value: metrics.epsBasic !== null ? `$${metrics.epsBasic.toFixed(2)}` : '—',
      positive: metrics.epsBasic !== null ? metrics.epsBasic > 0 : null,
    },
    {
      label: 'Free Cash Flow',
      value: formatLargeNumber(metrics.freeCashFlow),
      positive: metrics.freeCashFlow !== null ? metrics.freeCashFlow > 0 : null,
    },
    {
      label: 'Debt / Equity',
      value: metrics.debtToEquity !== null ? metrics.debtToEquity.toFixed(2) : '—',
      positive: metrics.debtToEquity !== null ? metrics.debtToEquity < 1.5 : null,
    },
    {
      label: 'Current Ratio',
      value: metrics.currentRatio !== null ? metrics.currentRatio.toFixed(2) : '—',
      positive: metrics.currentRatio !== null ? metrics.currentRatio > 1 : null,
    },
  ];

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Key Metrics — {ticker}
      </h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}
