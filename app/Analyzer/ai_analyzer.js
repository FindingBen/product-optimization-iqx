import JSON5 from "json5";
import {BUSINESS_RULESET_PROMPT} from "../Prompts/prompts";


class Prompting{
    constructor({client,data}){
        this.client = client;
        this.data = data;
    }


    async analyze_business(){
        const prompt = BUSINESS_RULESET_PROMPT(JSON.stringify(this.data, null, 2));
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            temperature: 0.2,
            messages: [
                { role: "system", content: "You are an ecommerce business classifier." },
                { role: "user", content: prompt },
            ],
        });
        const content =
            response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";
        const tryParse = (text) => {
            try {
                return JSON5.parse(text);
            } catch (err) {
                // Try to extract JSON from triple-backtick code fences
                const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                if (fence && fence[1]) {
                    return JSON5.parse(fence[1]);
                }

                // Try to extract the first {...} or [...] block
                const firstBrace = text.indexOf("{");
                const lastBrace = text.lastIndexOf("}");
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    const sub = text.slice(firstBrace, lastBrace + 1);
                    return JSON5.parse(sub);
                }

                const firstBracket = text.indexOf("[");
                const lastBracket = text.lastIndexOf("]");
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    const sub = text.slice(firstBracket, lastBracket + 1);
                    return JSON5.parse(sub);
                }

                // If all else fails, throw a clearer error including a short snippet
                const snippet = text ? text.slice(0, 300) : "<empty>";
                const e = new Error(`Failed to parse model response as JSON: ${err.message}. Response snippet: ${snippet}`);
                e.cause = err;
                throw e;
            }
        };

        return tryParse(content);
    }
}



export { Prompting };