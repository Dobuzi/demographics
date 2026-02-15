'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { usePrices } from '@/lib/hooks';
import { PriceRange, OHLCData } from '@/types';
import { computePriceChange, formatPercent } from '@/lib/transformers';
import { ChartSkeleton } from '../ui/Skeleton';
import { ErrorPanel } from '../ui/ErrorPanel';

const RANGES: PriceRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

interface PriceChartProps {
  ticker: string;
}

function hasCandlestickData(data: OHLCData[]): boolean {
  return data.some((d) => d.open !== d.close || d.high !== d.low);
}

export function PriceChart({ ticker }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [range, setRange] = useState<PriceRange>('1Y');
  const [chartMode, setChartMode] = useState<'candlestick' | 'line'>('candlestick');
  const { data, isLoading, error, refetch } = usePrices(ticker, range);

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
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
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
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !data?.data?.length) return;

    // Remove old series
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    const useCandlestick = chartMode === 'candlestick' && hasCandlestickData(data.data);

    if (useCandlestick) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      });
      const candleData: CandlestickData[] = data.data.map((d) => ({
        time: d.date as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      series.setData(candleData);
      mainSeriesRef.current = series;
    } else {
      const series = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      const lineData: LineData[] = data.data.map((d) => ({
        time: d.date as Time,
        value: d.close,
      }));
      series.setData(lineData);
      mainSeriesRef.current = series;
    }

    // Volume histogram
    const hasVolume = data.data.some((d) => d.volume > 0);
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      const volumeData: HistogramData[] = data.data.map((d) => ({
        time: d.date as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }));
      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    chart.timeScale().fitContent();
  }, [data, chartMode]);

  if (isLoading) return <ChartSkeleton />;
  if (error) return <ErrorPanel message={String(error)} onRetry={() => refetch()} />;
  if (data?.error) return <ErrorPanel message={data.error} onRetry={() => refetch()} />;

  const periodChange = data?.data ? computePriceChange(data.data) : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{ticker}</h3>
          {periodChange && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                periodChange.changePercent >= 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {periodChange.changePercent >= 0 ? '+' : ''}
              {formatPercent(periodChange.changePercent)}
            </span>
          )}
        </div>
        <button
          onClick={() => setChartMode((m) => (m === 'candlestick' ? 'line' : 'candlestick'))}
          className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          {chartMode === 'candlestick' ? 'Line' : 'Candle'}
        </button>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="h-72 w-full" />

      {/* Range selector */}
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
