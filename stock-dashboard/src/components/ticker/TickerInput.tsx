'use client';

import { useState, useCallback, useEffect } from 'react';

interface TickerInputProps {
  tickers: string[];
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  activeTicker: string;
  onSelect: (ticker: string) => void;
}

const TICKER_REGEX = /^[A-Z0-9.-]{1,10}$/;

export function TickerInput({
  tickers,
  onAdd,
  onRemove,
  activeTicker,
  onSelect,
}: TickerInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  // Persist tickers to localStorage
  useEffect(() => {
    localStorage.setItem('stock-dashboard-tickers', JSON.stringify(tickers));
  }, [tickers]);

  const handleAdd = useCallback(() => {
    const raw = input.trim().toUpperCase();
    if (!raw) return;

    // Support comma-separated input
    const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean);

    for (const symbol of symbols) {
      if (!TICKER_REGEX.test(symbol)) {
        setError(`Invalid ticker format: ${symbol}`);
        return;
      }
      if (tickers.includes(symbol)) {
        setError(`${symbol} already added`);
        return;
      }
    }

    setError('');
    symbols.forEach(onAdd);
    setInput('');
  }, [input, tickers, onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Add ticker (e.g., AAPL, TSLA)"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Ticker symbol input"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2" role="list" aria-label="Ticker list">
        {tickers.map((ticker) => (
          <div
            key={ticker}
            role="listitem"
            className={`group flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium cursor-pointer transition-colors ${
              ticker === activeTicker
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
            onClick={() => onSelect(ticker)}
          >
            <span>{ticker}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(ticker);
              }}
              className="ml-1 rounded-full p-0.5 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove ${ticker}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
