'use client';

import { useState } from 'react';
import { useFinancials } from '@/lib/hooks';
import { ReportingPeriod, StatementType } from '@/types';
import { computeKeyMetrics } from '@/lib/transformers';
import { FinancialTable } from './FinancialTable';
import { MetricsPanel } from './MetricsPanel';
import { TableSkeleton } from '../ui/Skeleton';
import { ErrorPanel, WarningPanel } from '../ui/ErrorPanel';

interface FinancialTabsProps {
  ticker: string;
}

const TABS: { key: StatementType; label: string }[] = [
  { key: 'income', label: 'Income Statement' },
  { key: 'balance', label: 'Balance Sheet' },
  { key: 'cashflow', label: 'Cash Flow' },
];

const PERIOD_OPTIONS: { value: ReportingPeriod; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
];

const LIMIT_OPTIONS = [4, 8, 12];

export function FinancialTabs({ ticker }: FinancialTabsProps) {
  const [activeTab, setActiveTab] = useState<StatementType>('income');
  const [period, setPeriod] = useState<ReportingPeriod>('annual');
  const [limit, setLimit] = useState(8);

  const {
    data: activeData,
    isLoading: activeLoading,
    error: activeError,
    refetch: activeRefetch,
  } = useFinancials(ticker, activeTab, period, limit);

  // Fetch all three for metrics computation (annual, limit 4 for metrics)
  const { data: incomeData } = useFinancials(ticker, 'income', 'annual', 4);
  const { data: balanceData } = useFinancials(ticker, 'balance', 'annual', 4);
  const { data: cashflowData } = useFinancials(ticker, 'cashflow', 'annual', 4);

  const metrics = computeKeyMetrics(
    incomeData ?? null,
    balanceData ?? null,
    cashflowData ?? null
  );

  return (
    <div className="space-y-4">
      {/* Metrics Panel */}
      <MetricsPanel metrics={metrics} ticker={ticker} />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                key === activeTab
                  ? 'bg-zinc-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  value === period
                    ? 'bg-zinc-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Limit selector */}
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
            aria-label="Number of periods"
          >
            {LIMIT_OPTIONS.map((l) => (
              <option key={l} value={l}>
                Last {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {activeLoading && <TableSkeleton />}
      {activeError && <ErrorPanel message={String(activeError)} onRetry={() => activeRefetch()} />}
      {activeData?.error && <WarningPanel message={activeData.error} />}
      {activeData && !activeData.error && <FinancialTable statement={activeData} />}
    </div>
  );
}
