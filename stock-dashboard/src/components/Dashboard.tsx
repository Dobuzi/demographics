'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceRange } from '@/types';
import { TickerInput } from './ticker/TickerInput';
import { QuickStats } from './ticker/QuickStats';
import { PriceChart } from './charts/PriceChart';
import { CompareChart } from './charts/CompareChart';
import { FinancialTabs } from './financials/FinancialTabs';
import { NewsList } from './news/NewsList';

const DEFAULT_TICKERS = ['AAPL', 'TSLA', 'BRK-B'];

function loadSavedTickers(): string[] {
  if (typeof window === 'undefined') return DEFAULT_TICKERS;
  try {
    const saved = localStorage.getItem('stock-dashboard-tickers');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TICKERS;
}

export function Dashboard() {
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [activeTicker, setActiveTicker] = useState<string>(DEFAULT_TICKERS[0]);
  const [showCompare, setShowCompare] = useState(false);
  const [range] = useState<PriceRange>('1Y');

  // Load saved tickers on mount
  useEffect(() => {
    const saved = loadSavedTickers();
    setTickers(saved);
    setActiveTicker(saved[0] || 'AAPL');
  }, []);

  const handleAddTicker = useCallback((ticker: string) => {
    setTickers((prev) => {
      if (prev.includes(ticker)) return prev;
      return [...prev, ticker];
    });
  }, []);

  const handleRemoveTicker = useCallback(
    (ticker: string) => {
      setTickers((prev) => {
        const next = prev.filter((t) => t !== ticker);
        if (activeTicker === ticker && next.length > 0) {
          setActiveTicker(next[0]);
        }
        return next;
      });
    },
    [activeTicker]
  );

  const handleSelectTicker = useCallback((ticker: string) => {
    setActiveTicker(ticker);
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ─── Left Sidebar ────────────────────────────────── */}
      <aside className="w-full shrink-0 border-b border-zinc-800 p-4 lg:w-72 lg:border-b-0 lg:border-r">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Watchlist
        </h2>

        <TickerInput
          tickers={tickers}
          onAdd={handleAddTicker}
          onRemove={handleRemoveTicker}
          activeTicker={activeTicker}
          onSelect={handleSelectTicker}
        />

        <div className="mt-6 space-y-2">
          {tickers.map((ticker) => (
            <div key={ticker} onClick={() => handleSelectTicker(ticker)} className="cursor-pointer">
              <QuickStats ticker={ticker} range={range} />
            </div>
          ))}
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────── */}
      <main className="flex-1 space-y-6 p-4 lg:p-6">
        {/* Chart Section */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Price Performance
            </h2>
            {tickers.length >= 2 && (
              <button
                onClick={() => setShowCompare((v) => !v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showCompare
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {showCompare ? 'Single View' : 'Compare'}
              </button>
            )}
          </div>

          {showCompare ? (
            <CompareChart tickers={tickers} />
          ) : (
            <PriceChart ticker={activeTicker} />
          )}
        </section>

        {/* Financials Section */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 lg:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Financial Statements — {activeTicker}
          </h2>
          <FinancialTabs ticker={activeTicker} />
        </section>

        {/* News Section */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 lg:p-6">
          <NewsList tickers={tickers} />
        </section>
      </main>
    </div>
  );
}
