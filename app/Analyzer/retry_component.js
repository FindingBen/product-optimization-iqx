const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RetrySafeOpenAI {
  constructor({ client }) {
    this.client = client;
  }

  async chatCompletion({ model, messages, temperature = 0.2, maxRetries = 5 }) {
    let attempt = 0;

    while (true) {
      try {
        return await this.client.chat.completions.create({
          model,
          temperature,
          messages,
        });
      } catch (e) {
        const isRateLimit = e?.status === 429 || e?.code === 'rate_limit_exceeded';
        const isServerError = e?.status >= 500;

        // Only retry on rate limits and server errors — fail fast on auth/bad request
        if (!isRateLimit && !isServerError) {
          console.error(`[OpenAI] Non-retryable error: ${e.message}`);
          throw e;
        }

        attempt += 1;
        if (attempt > maxRetries) {
          console.error(`[OpenAI] Max retries (${maxRetries}) exceeded`);
          throw e;
        }

        // Read Retry-After header if present, otherwise exponential backoff
        const retryAfter = e?.headers?.['retry-after'];
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(2 ** attempt * 1000, 30000) + Math.random() * 1000;

        console.warn(`[OpenAI] Rate limited. Attempt ${attempt}/${maxRetries}. Waiting ${Math.round(waitMs / 1000)}s...`);
        await sleep(waitMs);
      }
    }
  }
}

export { RetrySafeOpenAI };
