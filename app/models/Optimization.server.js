import prisma from "../db.server.js";
import {OpenAuthInit} from '../auth.js';
import {ProductEnhancement} from "../Analyzer/ai_analyzer.js";
import {ProductAnalyzer} from "../Analyzer/product_analyzer.js";
import {UPDATE_PRODUCT, IMAGE_ALT_UPDATE} from "../Queries/queries.js";


export async function handleOptimization({
  shop,
  admin,
  productId,
  automationRule
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  const rules = await prisma.businessRuleset.findUnique({
    where: { shop },
  });



const optimizationConfig = {
  title: automationRule?.optimizeTitle ?? rules.titleOptimize,
  description: automationRule?.optimizeDescription ?? rules.descriptionOptimize,
  alt: automationRule?.optimizeAltText ?? rules.altTextOptimize,
  seo: automationRule?.optimizeSeo ?? false
};

  const images = await prisma.productMedia.findMany({
    where: { productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }


  const auth = new OpenAuthInit(admin || {});
  const client = await auth.clientAuth();

 const enhancement = new ProductEnhancement(
  client,
  rules,
  product,
  images
);

let enhanced_title = null;
let enhanced_description = null;
let enhanced_alt = null;

if (optimizationConfig.title) {
  enhanced_title = await enhancement.enhance_title();
}

if (optimizationConfig.description) {
  enhanced_description = await enhancement.enhance_description();
}

if (optimizationConfig.alt) {
  enhanced_alt = await enhancement.enhance_alt_text();
}

const updateData = {};

if (enhanced_title) {
  updateData.title = enhanced_title.title;
}

if (enhanced_description) {
  updateData.description = enhanced_description.description;
}

if (enhanced_description?.metaDescription) {
  updateData.seoDescription = enhanced_description.metaDescription;
}

await prisma.$transaction(async (tx) => {
  const productContext = await tx.productContext.upsert({
    where: {
      shop_shopifyProductId: {
        shop,
        shopifyProductId: product.shopifyProductId,
      },
    },
    update: updateData,
    create: {
      shop,
      shopifyProductId: product.shopifyProductId,
      ...updateData,
    },
  });

  // Only create alt text if it exists
  if (enhanced_alt && enhanced_alt.length > 0) {
  await tx.productMediaContext.createMany({
    data: enhanced_alt.map((img) => {
      const original = images.find((i) => i.id === img.id);

      return {
        productId: productContext.id,
        shopifyMediaId: img.id, // <-- ADD THIS
        url: original?.url ?? "https://placehold.it/300x300",
        altText: img.alt,
      };
    }),
  });
}

  

  // await tx.product.update({
  //   where: { id: productId },
  //   data: { optimized: true },
  // });
});

  
  const results = [];

if (enhanced_title) {
  results.push({
    type: "TITLE",
    originalValue: product.title ?? null,
    optimizedValue: enhanced_title.title,
  });
}

if (enhanced_description) {
  results.push({
    type: "DESCRIPTION",
    originalValue: product.description ?? null,
    optimizedValue: enhanced_description.description,
  });

  if (enhanced_description.metaDescription) {
    results.push({
      type: "SEO_DESCRIPTION",
      originalValue: product.seoDescription ?? null,
      optimizedValue: enhanced_description.metaDescription,
    });
  }
}

if (enhanced_alt?.length > 0) {
  enhanced_alt.forEach((img) => {
    const original = images.find((i) => i.id === img.id);
    results.push({
      type: "ALT_TEXT",
      originalValue: original?.altText ?? null,
      optimizedValue: img.alt,
    });
  });
}

return results

}

export async function handleApprove({ session, productId, admin }) {
  try {
    // 1️⃣ Fetch product and its "draft context"
    const productContext = await prisma.productContext.findUnique({
      where: {
        shop_shopifyProductId: {
          shop: session.shop,
          shopifyProductId: productId,
        },
      },
    });

    const rules = await prisma.businessRuleset.findUnique({
      where: { shop: session.shop },
    });

    if (!productContext) {
      throw new Error("No product context found for approval");
    }
    console.log("Product context found for approval:", productId);

    const product = await prisma.product.findUnique({
      where: {
        shop_shopifyProductId: {
          shop: session.shop,
          shopifyProductId: productId,
        },
      },
    });

    const productMediasContext = await prisma.productMediaContext.findMany({
      where: { productId: productContext.id },
    });

    // 2️⃣ Build local update payload
    const data_update = { optimized: false };
    if (productContext.title) data_update.title = productContext.title;
    if (productContext.description) data_update.description = productContext.description;
    if (productContext.seoDescription) data_update.seoDescription = productContext.seoDescription;

    // 3️⃣ Update Shopify product — skip gracefully if missing
    if (product) {
      try {
        const input = { id: productId };
        if (productContext.title) input.title = productContext.title;
        if (productContext.description) input.descriptionHtml = productContext.description;
        if (productContext.seoDescription) input.seo = { description: productContext.seoDescription };

        const result = await admin.graphql(UPDATE_PRODUCT, { variables: { input } });
        const data = await result.json();

        if (data.data.productUpdate.userErrors.length > 0) {
          console.warn("Shopify product update skipped due to user errors:", data.data.productUpdate.userErrors);
        }

        // Update media alt text if applicable
        const files = productMediasContext
          .filter((m) => m.altText && m.shopifyMediaId)
          .map((m) => ({ id: m.shopifyMediaId, alt: m.altText }));

        if (files.length > 0) {
          const mediaResult = await admin.graphql(IMAGE_ALT_UPDATE, { variables: { files } });
          const mediaData = await mediaResult.json();
          if (mediaData.data.fileUpdate.userErrors.length > 0) {
            console.warn("Shopify media update skipped due to user errors:", mediaData.data.fileUpdate.userErrors);
          }
        }
      } catch (shopifyError) {
        console.warn(`Shopify update failed for ${productId}, continuing locally`, shopifyError);
      }
    } else {
      console.warn(`Product ${productId} missing in Shopify, skipping updates but processing locally`);
    }

    // 4️⃣ Persist locally and update optimizerJob status
    await prisma.$transaction(async (tx) => {
      if (product) {
        await tx.product.update({
          where: { shop_shopifyProductId: { shopifyProductId: productId, shop: session.shop } },
          data: data_update,
        });
      }

      // Delete the draft context
      await tx.productContext.delete({ where: { id: productContext.id } });

      // Clear media alt text to prevent duplication
      if (productMediasContext.length > 0) {
        await tx.productMedia.updateMany({
          where: { productId: product?.id || 0 },
          data: { altText: null },
        });
      }
    });

    // 5️⃣ Perform SEO analysis and mark optimizer job as approved
    if (product) {
      const updatedProduct = await prisma.product.findUnique({
        where: { shop_shopifyProductId: { shopifyProductId: productId, shop: session.shop } },
      });
      const images = await prisma.productMedia.findMany({ where: { productId } });

      const analyzer = new ProductAnalyzer(
        {
          id: updatedProduct.id,
          title: updatedProduct.title,
          description: updatedProduct.description,
          parentImages: images,
          variantImages: [],
        },
        rules
      );

      const analysis = analyzer.analyze();

      await prisma.$transaction(async (tx) => {
        await tx.seoAnalysis.upsert({
          where: { id: updatedProduct.id },
          update: {
            score: analysis.scores.seo,
            completeness: Math.min(analysis.scores.completeness, 100),
          },
          create: {
            productId: updatedProduct.id,
            score: analysis.scores.seo,
            completeness: Math.min(analysis.scores.completeness, 100),
          },
        });

        await tx.optimization.updateMany({
          where: {
            productId: product.id,
            shop: session.shop,
            status: "completed",
          },
          data: {
            status: "approved",
          },
        });
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Approval failed:", error);
    return { success: false, reason: error.message };
  }
}

export async function handleReject({ session, productId }) {
  try {
    // 1️⃣ Fetch product (may be null if deleted from Shopify)
    const product = await prisma.product.findUnique({
      where: {
        shop_shopifyProductId: {
          shop: session.shop,
          shopifyProductId: productId,
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      // 2️⃣ Try to find the product context
      const context = await tx.productContext.findUnique({
        where: {
          shop_shopifyProductId: {
            shop: session.shop,
            shopifyProductId: productId,
          },
        },
      });

      // 3️⃣ Delete context if it exists
      if (context) {
        await tx.productContext.delete({ where: { id: context.id } });
      } else {
        console.warn(`No product context found for rejection of ${productId}`);
      }

      // 4️⃣ Update product if it exists
      if (product) {
        await tx.product.update({
          where: {
            shop_shopifyProductId: {
              shop: session.shop,
              shopifyProductId: productId,
            },
          },
          data: { optimized: false },
        });

        // 5️⃣ Update optimizer job if product exists
        await tx.optimization.updateMany({
          where: {
            productId: product.id,
            shop: session.shop,
            status: "completed",
          },
          data: { status: "rejected" },
        });
      } else {
        console.warn(`Product ${productId} not found in DB, skipping product and optimization updates`);
      }
    });

    return { success: true };
  } catch (error) {
    console.error("handleReject failed:", error);
    return { success: false, reason: error.message };
  }
}

export async function fetchOptimizationJobs({shop}){
  // Return the count of optimization jobs for the given shop (useful for quick frontend display)
  const count = await prisma.optimization.count({ where: { shop } });
  return count;
}