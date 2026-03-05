import JSON5 from "json5";
import {BUSINESS_RULESET_PROMPT,PRODUCT_TITLE_PROMPT,PRODUCT_DESC_PROMPT,META_DESC_PROMPT,ALT_TEXT_PROMPT} from "../Prompts/prompts.js";


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

class ProductEnhancement{
    constructor(client,rules,product,images){
        this.client = client;
        this.rules = rules;
        this.product = product;
        this.images = images;
    }

    async enhance_title(){
        const prompt = PRODUCT_TITLE_PROMPT(this.product.title,this.rules,this.product.id);
        console.log("Prompt for title enhancement:", prompt);
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            temperature: 0.2,
            messages: [
                
                { role: "user", content: prompt },
            ],
        });
        console.log('RAW',response)
        const content =
            response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";
        console.log("Raw model response for title enhancement:", content);
        return JSON5.parse(content);    }

    async enhance_description(){
        const prompt = PRODUCT_DESC_PROMPT(this.product.title,this.rules,this.product.id);
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            temperature: 0.2,
            messages: [
                
                { role: "user", content: prompt },
            ],
        });
        console.log('RAW',response)
        const content =
            response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";
        console.log("Raw model response for title enhancement:", content);
        return JSON5.parse(content);
    }

    async enhance_alt_text(){
        if(!this.images || this.images.length === 0){
            console.log("No images found for product, skipping alt text enhancement.");
        return [];
        }
        const image_info = normalizeImages(this.images)
        console.log('AAAAAA',image_info)
        const prompt = ALT_TEXT_PROMPT(this.product.title,this.rules,image_info);
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            temperature: 0.2,
            messages: [
                
                { role: "user", content: prompt },
            ],
        });
        console.log('RAW alt',response)
        const content =
            response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";
        console.log("Raw model response for title enhancement:", content);
        return JSON5.parse(content);
    }

    async enhance_meta_description(){
const prompt = META_DESC_PROMPT(this.product.title,this.rules,this.product.id);
        const response = await this.client.chat.completions.create({
            model: "gpt-4",
            temperature: 0.2,
            messages: [
                
                { role: "user", content: prompt },
            ],
        });
        console.log('RAW',response)
        const content =
            response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";
        console.log("Raw model response for title enhancement:", content);
        return JSON5.parse(content);
    }
}



export { Prompting, ProductEnhancement };

// Helper to robustly parse JSON from model text
function parseModelJson(text) {
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

        const snippet = text ? text.slice(0, 300) : "<empty>";
        const e = new Error(`Failed to parse model response as JSON: ${err.message}. Response snippet: ${snippet}`);
        e.cause = err;
        throw e;
    }
}

export function normalizeImages(images) {
    const normalized = [];
    for (const img of images || []) {
        if (!img) continue;

        // Prisma model or object with explicit shopify id
        if (img.shopify_media_id || img.shopifyMediaId) {
            normalized.push({
                id: img.shopify_media_id ?? img.shopifyMediaId,
                src: img.src ?? img.url ?? img.imageUrl ?? null,
                altText: img.alt_text ?? img.altText ?? img.alt ?? "",
            });
        } else if (typeof img === "object") {
            // Plain object/dict
            normalized.push({
                id: img.id ?? img.shopify_media_id ?? null,
                src: img.src ?? img.url ?? img.imageUrl ?? null,
                altText: img.altText ?? img.alt ?? "",
            });
        }
    }
    return normalized;
}

export async function classifyImages({ client, images }) {
    const imgs = normalizeImages(images);

    const contentBlocks = [
        {
            type: "text",
            text: "Analyze each product image and return a JSON array. For every image include: id, description, objects, colors, material, background, detected_features.",
        },
    ];

    for (const img of imgs) {
        contentBlocks.push({ type: "text", text: `Image ID: ${img.id}` });
        contentBlocks.push({ type: "image_url", image_url: { url: img.src } });
    }

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
            { role: "system", content: "You are an expert product image classifier." },
            // send the blocks as a JSON string so the model receives structured content
            { role: "user", content: JSON.stringify(contentBlocks) },
        ],
    });

    const raw = response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? "";

    try {
        return parseModelJson(raw);
    } catch (err) {
        console.error("FAILED TO PARSE JSON:", raw);
        throw err;
    }
}