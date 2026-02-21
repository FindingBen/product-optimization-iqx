import prisma from "../db.server";
import shopify from "../shopify.server";
import {GET_ALL_PRODUCTS} from "../Queries/queries";
import { updateBusinessRuleset,getBusinessRuleset } from "./BusinessRuleset.server";
import ProductAnalyzer from "../Analyzer/ai_analyzer";

/**
 * Scan shop products and generate SEO analyses
 */
export async function scanProducts({ session, admin }) {
  const shop = session.shop;
  try {
    console.log("scanProducts called", { shop });
    // 1️⃣ Fetch active products (first 50 for MVP)
    const response = await admin.graphql( GET_ALL_PRODUCTS, {variables: { first: 50 } });
    const json = await response.json();

    if (json.errors) {
    console.error("Shopify GraphQL errors:", JSON.stringify(json.errors, null, 2));
    } 
    // Defensive: log structure
    if (!json.data) {
      console.error("No data in Shopify response", json);
      throw new Error("No data in Shopify response");
    }
    if (!json.data.products) {
      console.error("No products in Shopify response", json.data);
      throw new Error("No products in Shopify response");
    }
    if (!json.data.products.edges) {
      console.error("No product edges in Shopify response", json.data.products);
      throw new Error("No product edges in Shopify response");
    }

    // Shopify returns products as edges
    const products = json.data.products.edges.map(e => e.node);
    let totalScore = 0;
    const rules = await getBusinessRuleset(shop);
    if (!rules) {
      throw new Error("Cannot scan products without business ruleset");
    }
    // 2️⃣ Process each product
    for (const p of products) {
      // --- Upsert Product ---
      const product = await prisma.product.upsert({
        where: {
          shop_shopifyProductId: {
            shop,
            shopifyProductId: p.id,
          },
        },
        update: {
          title: p.title,
          description: p.descriptionHtml,
        },
        create: {
          shop,
          shopifyProductId: p.id,
          title: p.title,
          description: p.descriptionHtml,
        },
      });

      // --- Create Snapshot (ProductContext) ---
      const context = await prisma.productContext.create({
        data: {
          productId: product.id,
          title: p.title,
          description: p.descriptionHtml,
          metaDescription: extractMetaDescription(p.descriptionHtml),
        },
      });

      // --- Save Media Snapshot ---
      const images =
      p.media?.edges
        ?.filter(edge => edge.node?.image)
        ?.map(edge => edge.node.image) || [];
          if (images.length > 0) {
            await prisma.productMediaContext.createMany({
              data: images.map((img) => ({
                productContextId: context.id,
                url: img.url,
                altText: img.altText,
              })),
            });
          }

          // --- Calculate SEO Score ---
          const analyzer = new ProductAnalyzer(
            {
              id: product.id,
              title: p.title,
              description: p.descriptionHtml,
              parentImages: images,
              variantImages: []
            },
            rules
          );

        const analysis = analyzer.analyze();

      totalScore += analysis.scores.seo;

      await prisma.seoAnalysis.create({
        data: {
          productId: product.id,
          score: 0,
          completeness: "error",
          errors: JSON.stringify([
            { code: "ANALYSIS_FAILED", message: err.message }
          ]),
        },
      });

      continue; // 🔥 Do NOT break loop
    }

      totalScore += analysis.scores.seo;

      await prisma.seoAnalysis.create({
      data: {
        productId: product.id,
        score: Math.round(analysis.scores.seo),
        completeness:
          analysis.scores.seo >= 70 ? "good" : "poor",
        issues: JSON.stringify(analysis.issues),
        metadata: JSON.stringify(analysis.meta),
      },
    });

    await updateBusinessRuleset({ shop: session.shop, productScan: true });

    return {
      totalProducts: products.length,
      averageScore:
        products.length > 0
          ? Math.round(totalScore / products.length)
          : 0,
    };
    }
   catch (err) {
  console.error("Error type:", err?.constructor?.name);

  if (err instanceof Response) {
    try {
      const errorText = await err.text(); // read body exactly once
      console.error("Shopify GraphQL 400 body:", errorText);
    } catch (parseError) {
      console.error("Could not read error body:", parseError);
    }

    throw new Error("Shopify GraphQL request failed");
  }

  console.error("Non-Response error:", err);
  throw err;
}
}


export async function deleteProducts({session, admin}){
  const shop = session.shop;

  const response = await prisma.product.deleteMany({
    where:{
      shop
    }
  })

  return response;

}

function calculateSeoScore({ title, description, images }) {
  let score = 0;

  // Title length check
  if (title && title.length >= 20 && title.length <= 70) {
    score += 25;
  }

  // Description check
  if (description && description.length >= 120) {
    score += 30;
  }

  // Image count
  if (images.length >= 1) {
    score += 20;
  }

  // Alt text present
  const imagesWithAlt = images.filter((img) => img.altText);
  if (imagesWithAlt.length === images.length && images.length > 0) {
    score += 25;
  }

  return score;
}


function extractMetaDescription(html) {
  if (!html) return null;

  const stripped = html.replace(/<[^>]*>?/gm, "");
  return stripped.substring(0, 160);
}
