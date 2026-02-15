import { NextRequest, NextResponse } from 'next/server';
import { newsProvider } from '@/lib/providers';
import { cacheGet, cacheKey, cacheSet, TTL } from '@/lib/cache';
import { NewsResponse, NewsWindow } from '@/types';

const VALID_WINDOWS: NewsWindow[] = ['24h', '7d', '30d'];

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();
  const window = (req.nextUrl.searchParams.get('window') || '7d') as NewsWindow;

  if (!ticker) {
    return NextResponse.json({ error: 'ticker parameter required' }, { status: 400 });
  }
  if (!VALID_WINDOWS.includes(window)) {
    return NextResponse.json({ error: `Invalid window. Use: ${VALID_WINDOWS.join(', ')}` }, { status: 400 });
  }

  const key = cacheKey('news', ticker, window);
  const cached = cacheGet<NewsResponse>(key);
  if (cached) {
    console.log(`[api/news] Cache hit: ${key}`);
    return NextResponse.json(cached);
  }

  try {
    console.log(`[api/news] Fetching ${ticker} window=${window} via ${newsProvider.name}`);
    const data = await newsProvider.fetchNews(ticker, window);
    if (!data.error) {
      cacheSet(key, data, TTL.NEWS);
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[api/news] Error:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ticker, articles: [], error: message } satisfies NewsResponse,
      { status: 502 }
    );
  }
}
