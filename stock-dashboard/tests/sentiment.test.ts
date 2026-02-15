/**
 * Unit tests for sentiment analysis.
 * Run: npx tsx tests/sentiment.test.ts
 */

import assert from 'assert';
import { analyzeSentiment } from '../src/lib/sentiment';

// ─── Positive headlines ─────────────────────────────────────

const pos1 = analyzeSentiment('Apple stock surges to record high after strong earnings beat');
assert.strictEqual(pos1.sentiment, 'positive');
assert.ok(pos1.score > 0);
console.log('✓ Positive headline detected');

const pos2 = analyzeSentiment('Revenue growth exceeds expectations, bullish outlook');
assert.strictEqual(pos2.sentiment, 'positive');
console.log('✓ Positive financial headline detected');

// ─── Negative headlines ─────────────────────────────────────

const neg1 = analyzeSentiment('Stock crashes after fraud investigation announced');
assert.strictEqual(neg1.sentiment, 'negative');
assert.ok(neg1.score < 0);
console.log('✓ Negative headline detected');

const neg2 = analyzeSentiment('Company reports massive loss, layoffs expected');
assert.strictEqual(neg2.sentiment, 'negative');
console.log('✓ Negative financial headline detected');

// ─── Neutral headlines ──────────────────────────────────────

const neu1 = analyzeSentiment('Company announces quarterly results date');
assert.strictEqual(neu1.sentiment, 'neutral');
console.log('✓ Neutral headline detected');

const neu2 = analyzeSentiment('');
assert.strictEqual(neu2.sentiment, 'neutral');
assert.strictEqual(neu2.score, 0);
console.log('✓ Empty string is neutral');

// ─── Negation handling ──────────────────────────────────────

const negated = analyzeSentiment('Stock did not gain today');
// "not gain" should reduce positive signal
assert.ok(negated.score <= 0.15);
console.log('✓ Negation reduces positive sentiment');

// ─── Score range ────────────────────────────────────────────

const extreme = analyzeSentiment('crash plunge collapse bankruptcy fraud scandal');
assert.ok(extreme.score >= -1);
assert.ok(extreme.score <= 1);
console.log('✓ Score clamped to [-1, 1]');

console.log('\nAll sentiment tests passed!');
