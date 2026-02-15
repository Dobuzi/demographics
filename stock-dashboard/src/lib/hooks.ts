/**
 * React Query hooks for data fetching.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FinancialStatement,
  NewsResponse,
  PriceRange,
  PriceResponse,
  ReportingPeriod,
  StatementType,
  NewsWindow,
} from '@/types';

export function usePrices(ticker: string, range: PriceRange) {
  return useQuery<PriceResponse>({
    queryKey: ['prices', ticker, range],
    queryFn: async () => {
      const res = await fetch(`/api/prices?ticker=${encodeURIComponent(ticker)}&range=${range}`);
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useFinancials(
  ticker: string,
  type: StatementType,
  period: ReportingPeriod,
  limit: number = 8
) {
  return useQuery<FinancialStatement>({
    queryKey: ['financials', ticker, type, period, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/financials?ticker=${encodeURIComponent(ticker)}&type=${type}&period=${period}&limit=${limit}`
      );
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });
}

export function useNews(ticker: string, window: NewsWindow) {
  return useQuery<NewsResponse>({
    queryKey: ['news', ticker, window],
    queryFn: async () => {
      const res = await fetch(`/api/news?ticker=${encodeURIComponent(ticker)}&window=${window}`);
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}

export function useValidateTicker(ticker: string) {
  return useQuery<{ valid: boolean; name?: string; ticker: string }>({
    queryKey: ['validate', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/validate?ticker=${encodeURIComponent(ticker)}`);
      return res.json();
    },
    enabled: !!ticker && ticker.length >= 1,
    staleTime: 60 * 60 * 1000,
  });
}
