/**
 * Simple keyword-based sentiment analysis.
 *
 * This is a local heuristic implementation. Designed to be swappable
 * with an LLM-based or external API sentiment analyzer by implementing
 * the same interface: { sentiment: Sentiment, score: number }.
 */

import { Sentiment } from '@/types';

// Word lists with weights
const POSITIVE_WORDS: Record<string, number> = {
  // Strong positive
  surge: 0.8, soar: 0.8, rally: 0.7, breakout: 0.7, boom: 0.7,
  skyrocket: 0.9, bullish: 0.7, outperform: 0.6, beat: 0.5,
  // Medium positive
  gain: 0.4, rise: 0.4, up: 0.3, growth: 0.5, profit: 0.5,
  upgrade: 0.6, positive: 0.4, strong: 0.4, record: 0.5,
  optimistic: 0.5, buy: 0.4, high: 0.3, above: 0.2,
  revenue: 0.1, innovation: 0.4, expand: 0.4, success: 0.5,
  exceed: 0.5, recover: 0.4, improve: 0.4,
  dividend: 0.3, approval: 0.4, launch: 0.3,
};

const NEGATIVE_WORDS: Record<string, number> = {
  // Strong negative
  crash: 0.9, plunge: 0.8, collapse: 0.8, bearish: 0.7,
  bankruptcy: 0.9, fraud: 0.9, scandal: 0.8, lawsuit: 0.6,
  // Medium negative
  drop: 0.4, fall: 0.4, decline: 0.5, loss: 0.5, down: 0.3,
  downgrade: 0.6, negative: 0.4, weak: 0.4, miss: 0.5,
  warning: 0.5, sell: 0.4, low: 0.3, below: 0.3,
  debt: 0.2, risk: 0.3, fear: 0.5, concern: 0.4,
  cut: 0.3, layoff: 0.6, recession: 0.6, investigation: 0.5,
  delay: 0.3, recall: 0.5, fine: 0.4,
};

// Negation words that flip sentiment
const NEGATION = new Set(['not', 'no', "n't", 'never', 'neither', 'nor', 'barely', 'hardly']);

export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1 to 1
}

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);

  let totalScore = 0;
  let wordCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    const isNegated = NEGATION.has(prevWord) || prevWord.endsWith("n't");

    if (POSITIVE_WORDS[word] !== undefined) {
      const score = isNegated ? -POSITIVE_WORDS[word] * 0.5 : POSITIVE_WORDS[word];
      totalScore += score;
      wordCount++;
    } else if (NEGATIVE_WORDS[word] !== undefined) {
      const score = isNegated ? NEGATIVE_WORDS[word] * 0.5 : -NEGATIVE_WORDS[word];
      totalScore += score;
      wordCount++;
    }
  }

  // Normalize
  const normalized = wordCount > 0 ? totalScore / wordCount : 0;
  const clampedScore = Math.max(-1, Math.min(1, normalized));

  let sentiment: Sentiment = 'neutral';
  if (clampedScore > 0.15) sentiment = 'positive';
  else if (clampedScore < -0.15) sentiment = 'negative';

  return { sentiment, score: Math.round(clampedScore * 100) / 100 };
}
