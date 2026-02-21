export const BUSINESS_RULESET_PROMPT = (business_data) => `
You are an ecommerce business classifier.
        Based on the following Shopify store data: ${business_data}

        Identify the following details about the business and keep them under 80 words each:
        - The business niche
        - What products they likely sell
        - Target audience
        - Brand tone/voice
        - Professionalism level (1-10)
        - Recommended SEO ruleset for product info(make sure to keep reccomended_seo_ruleset always the same name as column):
            - productNameRule
            - productDescriptionRule
            - productImageRule
            - productVariantRule
            - productTagRule
            - productAltImageRule
        Return a JSON object and keep each rule value under 80 words please.`