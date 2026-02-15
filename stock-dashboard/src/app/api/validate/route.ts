import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheKey, cacheSet, TTL } from '@/lib/cache';
import { fetchWithRetry } from '@/lib/providers/fetch-utils';

/**
 * Server-side ticker validation using Alpha Vantage SYMBOL_SEARCH.
 * Returns { valid: boolean, name?: string }
 */
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'ticker parameter required' }, { status: 400 });
  }

  // Basic format check
  if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return NextResponse.json({ valid: false, ticker });
  }

  const key = cacheKey('validate', ticker);
  const cached = cacheGet<{ valid: boolean; name?: string }>(key);
  if (cached) {
    return NextResponse.json({ ...cached, ticker });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    // Without API key, accept any well-formatted ticker
    return NextResponse.json({ valid: true, ticker, name: ticker });
  }

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
    const res = await fetchWithRetry(url, 'AlphaVantage');
    const json = await res.json();

    const matches = json.bestMatches || [];
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const exactMatch = matches.find(
      (m: any) => m['1. symbol']?.toUpperCase() === ticker
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const result = exactMatch
      ? { valid: true, name: exactMatch['2. name'] }
      : { valid: matches.length > 0, name: matches[0]?.['2. name'] };

    cacheSet(key, result, TTL.VALIDATION);
    return NextResponse.json({ ...result, ticker });
  } catch {
    // On error, accept the ticker to avoid blocking the user
    return NextResponse.json({ valid: true, ticker, name: ticker });
  }
}
