'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time, LineSeries } from 'lightweight-charts';
import { PriceRange, OHLCData } from '@/types';
import { normalizePriceSeries } from '@/lib/transformers';
import { ChartSkeleton } from '../ui/Skeleton';
import { ErrorPanel } from '../ui/ErrorPanel';
import { useQueries } from '@tanstack/react-query';
import { PriceResponse } from '@/types';

const RANGES: PriceRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#84cc16'];

interface CompareChartProps {
  tickers: string[];
}

export function CompareChart({ tickers }: CompareChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const [range, setRange] = useState<PriceRange>('1Y');

  const queries = useQueries({
    queries: tickers.map((ticker) => ({
      queryKey: ['prices', ticker, range],
      queryFn: async (): Promise<PriceResponse> => {
        const res = await fetch(`/api/prices?ticker=${encodeURIComponent(ticker)}&range=${range}`);
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.error);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#a1a1aa',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, []);

  // Update data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || isLoading) return;

    // Remove old series
    seriesRefs.current.forEach((s) => chart.removeSeries(s));
    seriesRefs.current = [];

    const validData = queries
      .filter((q) => q.data && !q.data.error && q.data.data.length > 0)
      .map((q) => ({
        ticker: q.data!.ticker,
        data: q.data!.data as OHLCData[],
      }));

    if (validData.length === 0) return;

    const normalized = normalizePriceSeries(validData);

    normalized.forEach(({ ticker, data }, i) => {
      const color = COLORS[i % COLORS.length];
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        title: ticker,
        crosshairMarkerVisible: true,
      });
      const lineData: LineData[] = data.map((d) => ({
        time: d.date as Time,
        value: d.value,
      }));
      series.setData(lineData);
      seriesRefs.current.push(series);
    });

    chart.timeScale().fitContent();
  }, [queries, isLoading]);

  if (tickers.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-700/50 p-6 text-center text-sm text-zinc-500">
        Add at least 2 tickers to enable comparison mode
      </div>
    );
  }

  if (isLoading) return <ChartSkeleton />;
  if (hasError) return <ErrorPanel message="Failed to load comparison data" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Comparison (Normalized to 100)</h3>
        <div className="flex gap-2">
          {tickers.map((t, i) => (
            <span
              key={t}
              className="text-xs font-medium"
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} className="h-64 w-full" />

      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              r === range
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
