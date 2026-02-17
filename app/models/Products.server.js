import prisma from "../db.server";
import { updateBusinessRuleset } from "./BusinessRuleset.server";

/**
 * Scan shop products and generate SEO analyses
 */
export async function scanProducts({ session, admin }) {
  const shop = session.shop;

  // 1️⃣ Fetch active products (first 50 for MVP)
  const response = await admin.graphql(`
    query getProducts {
      products(first: 50, query: "status:active") {
        nodes {
          id
          title
          descriptionHtml
          images(first: 10) {
            nodes {
              id
              url
              altText
            }
          }
        }
      }
    }
  `);

  const json = await response.json();

  if (!json.data?.products?.nodes) {
    throw new Error("Failed to fetch products from Shopify");
  }

  const products = json.data.products.nodes;

  let totalScore = 0;

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
    if (p.images.nodes.length > 0) {
      await prisma.productMediaContext.createMany({
        data: p.images.nodes.map((img) => ({
          productContextId: context.id,
          url: img.url,
          altText: img.altText,
        })),
      });
    }

    // --- Calculate SEO Score ---
    const score = calculateSeoScore({
      title: p.title,
      description: p.descriptionHtml,
      images: p.images.nodes,
    });

    totalScore += score;

    await prisma.seoAnalysis.create({
      data: {
        productId: product.id,
        score,
        completeness: score > 70 ? "good" : "poor",
      },
    });
  }

  await updateBusinessRuleset({ shop: session.shop, productScan: true });

  return {
    totalProducts: products.length,
    averageScore:
      products.length > 0
        ? Math.round(totalScore / products.length)
        : 0,
  };
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
