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

export const PRODUCT_TITLE_PROMPT = (title,rules,product_id) => `
You are an expert Shopify SEO title optimizer.

        Generate ONE optimized product title based on:
        - Original title: "${title}"
        - Keywords: ${rules.keywords}
        - Title rules: ${rules.product_name_rule}
        - Length: ${rules.min_title_length}–${rules.max_title_length} characters

        Rules:
        - Generate EXACTLY ONE title
        - Do NOT provide multiple options
        - Do NOT include explanations
        - Output ONLY valid JSON

        Return EXACTLY this object:
        {{
        "product_id": "${product_id}",
        "title": "<optimized title>"
        }}
`

export const PRODUCT_DESC_PROMPT = (title,rules,product_id) => `
Generate a product description following these rules:

        - SEO best practices
        - Length between ${rules.min_description_length} and ${rules.max_description_length} characters
        - Description rules: ${rules.product_description_rule}
        - Use keywords: ${rules.keywords || "None"}
        - The product title is: "${title}"

        Return a JSON object where description is:
        {{
        "product_id": "${product_id}",
        "description": "<generated/modified description>"
        }}
`

export const ALT_TEXT_PROMPT = (title,rules,image_info) => `
You are an expert Shopify SEO image optimizer.
        Generate ALTERNATIVE TEXT for EACH image separately.

        Follow these rules:
        - Use the image description + detected objects/colors
        - Include relevant keywords: ${rules.keywords}
        - Recommended length: 5–20 words
        - ${rules.product_alt_image_rule}
        - Max length: ${rules.max_alt_desc_length} characters
        - Alt text MUST describe what is visually in the image
        - Do NOT output explanations. Output ONLY pure JSON.

        Input image analysis:
        ${JSON.stringify(image_info, null, 2)}

        Return a JSON array where EACH element is:
        {{
        "id": "<image_gid>",
        "alt": "<generated alt text>"
        }}
`

export const META_DESC_PROMPT = (product_id,rules,title) => `
Generate a product description following these rules:

        - SEO best practices
        - Length up to 160 characters no more!
        - Use keywords: ${rules.keywords || "None"}
        - The product title is: "${title}"

        Return a JSON object where description is:
        {{
        "product_id": "${product_id}",
        "description": "<generated/modified meta description>"
        }}
`