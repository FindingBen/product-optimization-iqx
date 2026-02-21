import {OpenAuthInit} from '../app/auth';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RetrySafeOpenAI {
	constructor({ client } = {}) {
		if (client) {
			this.client = client;
		} else {
			// Try to load a client factory if present at ../base/auth
			try {
				const authModule = OpenAuthInit()
				if (authModule && typeof authModule.OpenAiAuthInit === 'function') {
					this.client = authModule.clientAuth();
				} else if (
					authModule &&
					authModule.OpenAiAuthInit &&
					typeof authModule.OpenAiAuthInit.clientAuth === 'function'
				) {
					this.client = authModule.OpenAiAuthInit.clientAuth();
				}
			} catch (err) {
				// If the module isn't present, leave client undefined and
				// require the caller to pass a `client` in the constructor.
			}
		}
	}

	async chatCompletion({ model, messages, maxRetries = 5 }) {
		let attempt = 0;

		while (true) {
			try {
				if (!this.client) {
					throw new Error(
						'OpenAI client not initialized. Pass `client` to constructor or provide ../base/auth OpenAiAuthInit.'
					);
				}

				return await this.client.chat.completions.create({ model, messages });
			} catch (e) {
				console.warn(`OpenAI API error: ${e}. Retrying...`);
				attempt += 1;
				if (attempt > maxRetries) throw e;

				// exponential backoff with jitter (seconds)
				const sleepTimeSec = Math.min(2 ** attempt, 30) + Math.random();
				await sleep(Math.floor(sleepTimeSec * 1000));
			}
		}
	}
}

module.exports = { RetrySafeOpenAI };
