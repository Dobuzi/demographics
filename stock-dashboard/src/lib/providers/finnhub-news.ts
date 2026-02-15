/**
 * Finnhub news provider adapter.
 * Docs: https://finnhub.io/docs/api/company-news
 * Free tier: 60 calls/min.
 */

import { NewsArticle, NewsProvider, NewsResponse, NewsWindow } from '@/types';
import { fetchWithRetry, ProviderError } from './fetch-utils';
import { analyzeSentiment } from '../sentiment';

const PROVIDER = 'Finnhub';
const BASE_URL = 'https://finnhub.io/api/v1';

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new ProviderError(PROVIDER, null, 'FINNHUB_API_KEY not set');
  return key;
}

function windowToDates(window: NewsWindow): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  switch (window) {
    case '24h':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseArticles(ticker: string, items: any[]): NewsArticle[] {
  return items.map((item, i) => {
    const headline = item.headline || '';
    const summary = item.summary || '';
    const { sentiment, score } = analyzeSentiment(headline + ' ' + summary);

    return {
      id: `${ticker}-${item.id || i}-${item.datetime}`,
      ticker,
      headline,
      summary: summary.slice(0, 300),
      source: item.source || 'Unknown',
      url: item.url || '',
      datetime: new Date((item.datetime || 0) * 1000).toISOString(),
      sentiment,
      sentimentScore: score,
    };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Deduplicate near-identical headlines using Jaccard similarity on word sets. */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen: Set<string>[] = [];
  const result: NewsArticle[] = [];

  for (const article of articles) {
    const words = new Set(
      article.headline.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
    );
    const isDuplicate = seen.some((prev) => {
      const intersection = [...words].filter((w) => prev.has(w)).length;
      const union = new Set([...words, ...prev]).size;
      return union > 0 && intersection / union > 0.7;
    });

    if (!isDuplicate) {
      seen.push(words);
      result.push(article);
    }
  }

  return result;
}

export const finnhubNews: NewsProvider = {
  name: PROVIDER,

  async fetchNews(ticker: string, window: NewsWindow): Promise<NewsResponse> {
    const { from, to } = windowToDates(window);
    const url = `${BASE_URL}/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${getApiKey()}`;

    const res = await fetchWithRetry(url, PROVIDER);
    const json = await res.json();

    if (!Array.isArray(json)) {
      return { ticker, articles: [], error: 'Unexpected response format' };
    }

    const articles = parseArticles(ticker, json);
    const deduplicated = deduplicateArticles(articles);

    return { ticker, articles: deduplicated };
  },
};
