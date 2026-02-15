/**
 * Provider registry — swap implementations by changing these exports.
 */

import { FinancialProvider, NewsProvider, PriceProvider } from '@/types';
import { alphaVantagePrice } from './alpha-vantage-price';
import { alphaVantageFinancials } from './alpha-vantage-financials';
import { finnhubNews } from './finnhub-news';

// Active providers — change these to swap data sources
export const priceProvider: PriceProvider = alphaVantagePrice;
export const financialProvider: FinancialProvider = alphaVantageFinancials;
export const newsProvider: NewsProvider = finnhubNews;
