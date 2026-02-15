/**
 * Alpha Vantage price provider adapter.
 * Docs: https://www.alphavantage.co/documentation/
 *
 * Free tier: 25 requests/day. We cache aggressively to stay within limits.
 * Handles BRK-B style tickers (hyphen) — Alpha Vantage uses dot notation (BRK.B is not needed, it accepts BRK-B).
 */

import { OHLCData, PriceProvider, PriceRange, PriceResponse } from '@/types';
import { fetchWithRetry, ProviderError } from './fetch-utils';

const PROVIDER = 'AlphaVantage';
const BASE_URL = 'https://www.alphavantage.co/query';

function getApiKey(): string {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new ProviderError(PROVIDER, null, 'ALPHA_VANTAGE_API_KEY not set');
  return key;
}

// Map our range to Alpha Vantage function + outputsize
function rangeToParams(range: PriceRange): { fn: string; outputsize: string } {
  switch (range) {
    case '1W':
    case '1M':
      return { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' }; // last 100 days
    case '3M':
    case '6M':
    case '1Y':
      return { fn: 'TIME_SERIES_DAILY', outputsize: 'full' };
    case '5Y':
    case 'MAX':
      return { fn: 'TIME_SERIES_WEEKLY', outputsize: 'full' };
    default:
      return { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' };
  }
}

function rangeToDays(range: PriceRange): number {
  switch (range) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case '5Y': return 1825;
    case 'MAX': return 99999;
    default: return 30;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseDaily(json: any): OHLCData[] {
  const series = json['Time Series (Daily)'] || json['Weekly Time Series'];
  if (!series) return [];

  return Object.entries(series).map(([date, vals]: [string, any]) => ({
    date,
    open: parseFloat(vals['1. open']),
    high: parseFloat(vals['2. high']),
    low: parseFloat(vals['3. low']),
    close: parseFloat(vals['4. close']),
    volume: parseInt(vals['5. volume'], 10),
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const alphaVantagePrice: PriceProvider = {
  name: PROVIDER,

  async fetchPrices(ticker: string, range: PriceRange): Promise<PriceResponse> {
    const { fn, outputsize } = rangeToParams(range);
    const url = `${BASE_URL}?function=${fn}&symbol=${encodeURIComponent(ticker)}&outputsize=${outputsize}&apikey=${getApiKey()}`;

    const res = await fetchWithRetry(url, PROVIDER);
    const json = await res.json();

    // Alpha Vantage returns error messages in JSON body
    if (json['Error Message']) {
      return { ticker, data: [], range, error: json['Error Message'] };
    }
    if (json['Note']) {
      return { ticker, data: [], range, error: 'Rate limit reached. Try again later.' };
    }

    let data = parseDaily(json);

    // Sort ascending by date
    data.sort((a, b) => a.date.localeCompare(b.date));

    // Trim to requested range
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeToDays(range));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    data = data.filter((d) => d.date >= cutoffStr);

    return { ticker, data, range };
  },
};
