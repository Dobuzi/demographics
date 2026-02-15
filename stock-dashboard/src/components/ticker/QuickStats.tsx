'use client';

import { usePrices } from '@/lib/hooks';
import { computeDayChange, computePriceChange, formatCurrency, formatPercent } from '@/lib/transformers';
import { PriceRange } from '@/types';
import { Skeleton } from '../ui/Skeleton';

interface QuickStatsProps {
  ticker: string;
  range: PriceRange;
}

export function QuickStats({ ticker, range }: QuickStatsProps) {
  const { data, isLoading } = usePrices(ticker, range);

  if (isLoading) {
    return (
      <div className="space-y-1 py-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (!data || data.error || data.data.length === 0) return null;

  const lastPrice = data.data[data.data.length - 1]?.close;
  const periodChange = computePriceChange(data.data);
  const dayChange = computeDayChange(data.data);

  return (
    <div className="space-y-1 rounded-lg bg-zinc-800/50 p-3">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{ticker}</div>
      <div className="text-xl font-semibold text-white">{formatCurrency(lastPrice)}</div>
      <div className="flex gap-3 text-xs">
        <span className={dayChange.change >= 0 ? 'text-green-400' : 'text-red-400'}>
          Day: {dayChange.change >= 0 ? '+' : ''}{formatCurrency(dayChange.change)}{' '}
          ({dayChange.changePercent >= 0 ? '+' : ''}{formatPercent(dayChange.changePercent)})
        </span>
      </div>
      <div className="text-xs">
        <span className={periodChange.change >= 0 ? 'text-green-400' : 'text-red-400'}>
          {range}: {periodChange.change >= 0 ? '+' : ''}{formatPercent(periodChange.changePercent)}
        </span>
      </div>
    </div>
  );
}
