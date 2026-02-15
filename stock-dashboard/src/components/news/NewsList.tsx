'use client';

import { useState } from 'react';
import { useNews } from '@/lib/hooks';
import { NewsArticle, NewsWindow, Sentiment } from '@/types';
import { NewsSkeleton } from '../ui/Skeleton';
import { ErrorPanel } from '../ui/ErrorPanel';

interface NewsListProps {
  tickers: string[];
}

const WINDOWS: { value: NewsWindow; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

const SENTIMENT_BADGE: Record<Sentiment, { bg: string; text: string; label: string }> = {
  positive: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Positive' },
  neutral: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Neutral' },
  negative: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Negative' },
};

function NewsCard({ article }: { article: NewsArticle }) {
  const badge = SENTIMENT_BADGE[article.sentiment];
  const datetime = new Date(article.datetime);
  const timeAgo = getTimeAgo(datetime);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-white line-clamp-2">{article.headline}</h4>
          {article.summary && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{article.summary}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <span>{article.source}</span>
            <span>·</span>
            <time dateTime={article.datetime}>{timeAgo}</time>
            <span>·</span>
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-zinc-300">
              {article.ticker}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
      </div>
    </a>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NewsForTicker({ ticker, window }: { ticker: string; window: NewsWindow }) {
  const { data, isLoading, error, refetch } = useNews(ticker, window);

  if (isLoading) return <NewsSkeleton />;
  if (error) return <ErrorPanel message={String(error)} onRetry={() => refetch()} />;
  if (data?.error) return <ErrorPanel message={data.error} onRetry={() => refetch()} />;
  if (!data?.articles.length) {
    return (
      <div className="text-center text-sm text-zinc-500 py-4">
        No news found for {ticker}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.articles.slice(0, 10).map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}

export function NewsList({ tickers }: NewsListProps) {
  const [window, setWindow] = useState<NewsWindow>('7d');
  const [filterTicker, setFilterTicker] = useState<string>('all');

  const displayTickers = filterTicker === 'all' ? tickers : [filterTicker];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">News</h3>

        <div className="flex items-center gap-3">
          {/* Ticker filter */}
          <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
            <button
              onClick={() => setFilterTicker('all')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                filterTicker === 'all'
                  ? 'bg-zinc-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {tickers.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTicker(t)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  filterTicker === t
                    ? 'bg-zinc-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Window filter */}
          <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
            {WINDOWS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setWindow(value)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  value === window
                    ? 'bg-zinc-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {displayTickers.map((ticker) => (
        <NewsForTicker key={`${ticker}-${window}`} ticker={ticker} window={window} />
      ))}
    </div>
  );
}
