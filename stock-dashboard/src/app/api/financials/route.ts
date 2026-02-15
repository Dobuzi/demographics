import { NextRequest, NextResponse } from 'next/server';
import { financialProvider } from '@/lib/providers';
import { cacheGet, cacheKey, cacheSet, TTL } from '@/lib/cache';
import { FinancialStatement, ReportingPeriod, StatementType } from '@/types';

const VALID_TYPES: StatementType[] = ['income', 'balance', 'cashflow'];
const VALID_PERIODS: ReportingPeriod[] = ['annual', 'quarterly'];

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();
  const type = (req.nextUrl.searchParams.get('type') || 'income') as StatementType;
  const period = (req.nextUrl.searchParams.get('period') || 'annual') as ReportingPeriod;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '8', 10);

  if (!ticker) {
    return NextResponse.json({ error: 'ticker parameter required' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Use: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: `Invalid period. Use: ${VALID_PERIODS.join(', ')}` }, { status: 400 });
  }

  const key = cacheKey('financials', ticker, type, period, String(limit));
  const cached = cacheGet<FinancialStatement>(key);
  if (cached) {
    console.log(`[api/financials] Cache hit: ${key}`);
    return NextResponse.json(cached);
  }

  try {
    console.log(`[api/financials] Fetching ${ticker} ${type} ${period} via ${financialProvider.name}`);
    const data = await financialProvider.fetchFinancials(ticker, type, period, limit);
    if (!data.error) {
      cacheSet(key, data, TTL.FINANCIALS);
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[api/financials] Error:`, err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ticker, type, period, dates: [], rows: [], error: message } satisfies FinancialStatement,
      { status: 502 }
    );
  }
}
