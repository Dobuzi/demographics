import { NextRequest, NextResponse } from 'next/server';
import { priceProvider } from '@/lib/providers';
import { cacheGet, cacheKey, cacheSet, TTL } from '@/lib/cache';
import { PriceRange, PriceResponse } from '@/types';

const VALID_RANGES: PriceRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();
  const range = (req.nextUrl.searchParams.get('range') || '1M') as PriceRange;

  if (!ticker) {
    return NextResponse.json({ error: 'ticker parameter required' }, { status: 400 });
  }
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: `Invalid range. Use: ${VALID_RANGES.join(', ')}` }, { status: 400 });
  }

  const key = cacheKey('prices', ticker, range);
  const cached = cacheGet<PriceResponse>(key);
  if (cached) {
    console.log(`[api/prices] Cache hit: ${key}`);
    return NextResponse.json(cached);
  }

  try {
    console.log(`[api/prices] Fetching ${ticker} range=${range} via ${priceProvider.name}`);
    const data = await priceProvider.fetchPrices(ticker, range);
    if (!data.error) {
      cacheSet(key, data, TTL.PRICES);
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[api/prices] Error:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ticker, data: [], range, error: message } satisfies PriceResponse,
      { status: 502 }
    );
  }
}
