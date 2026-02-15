/**
 * Shared fetch utilities with retry + exponential backoff.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public statusCode: number | null,
    message: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}

export async function fetchWithRetry(
  url: string,
  provider: string,
  options?: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: options?.signal ?? AbortSignal.timeout(15000),
      });

      if (res.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${provider}] Rate limited, retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      if (!res.ok) {
        throw new ProviderError(provider, res.status, `HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (err) {
      lastError = err as Error;
      if (err instanceof ProviderError && err.statusCode && err.statusCode < 500) {
        throw err; // Don't retry client errors (except 429 handled above)
      }
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[${provider}] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new ProviderError(provider, null, 'All retries exhausted');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
