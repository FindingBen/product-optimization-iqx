import OpenAI from 'openai';

function normalizeOpenAIApiKey(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    const normalized = trimmed.replace(/^[\\'"]+/, '').replace(/[\\'"]+$/, '');

    if (!normalized || normalized.includes('${{')) {
        return '';
    }

    if (normalized !== trimmed) {
        console.warn('[OpenAI] Normalized OPENAI_API_KEY from environment.');
    }

    return normalized;
}

class OpenAuthInit{
    constructor({}){
    }


    async clientAuth(){
        const apiKey = normalizeOpenAIApiKey(process.env['OPENAI_API_KEY']);

        if (!apiKey) {
            throw new Error('[OpenAI] Missing or invalid OPENAI_API_KEY.');
        }

        const openai = new OpenAI({
            apiKey,
        });
        return openai;
    }
}

export {OpenAuthInit, normalizeOpenAIApiKey}