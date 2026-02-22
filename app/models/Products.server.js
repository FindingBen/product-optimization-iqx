import prisma from "../db.server";
import shopify from "../shopify.server";
import {GET_ALL_PRODUCTS} from "../Queries/queries";
import { updateBusinessRuleset,getBusinessRuleset } from "./BusinessRuleset.server";
import {ProductAnalyzer} from "../Analyzer/product_analyzer";

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
    let totalCompletenessScore = 0;
    const rules = await getBusinessRuleset(shop);
    if (!rules) {
      throw new Error("Cannot scan products without business ruleset");
    }
    // 2️⃣ Process each product

    for (const p of products) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.upsert({
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

        const context = await tx.productContext.create({
          data: {
            productId: product.id,
            title: p.title,
            description: p.descriptionHtml,
            metaDescription: extractMetaDescription(p.descriptionHtml),
          },
        });

        const images =
          p.media?.edges
            ?.filter(edge => edge.node?.image)
            ?.map(edge => edge.node.image) || [];
        if (images.length > 0) {
          await tx.productMediaContext.createMany({
            data: images.map((img) => ({
              productContextId: context.id,
              url: img.url,
              altText: img.altText,
            })),
          });
        }

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
        totalCompletenessScore += analysis.scores.completeness;
        await tx.seoAnalysis.create({
          data: {
            product: {
              connect: { id: product.id },
            },
            score: analysis.scores.seo,
            completeness: Math.min(analysis.scores.completeness, 100),
          },
        });
      });
    }

    await updateBusinessRuleset({ shop: session.shop, productScan: true });
    return {
      totalProducts: products.length,
      averageScore:
        products.length > 0
          ? Math.round(totalScore / products.length)
          : 0,
      averageCompleteness:
        products.length > 0
          ? Math.round(Math.min(totalCompletenessScore / products.length, 100))
          : 0,
    };
    }
   catch (err) {

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



function extractMetaDescription(html) {
  if (!html) return null;

  const stripped = html.replace(/<[^>]*>?/gm, "");
  return stripped.substring(0, 160);
}
