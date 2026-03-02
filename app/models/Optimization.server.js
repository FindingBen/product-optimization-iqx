import prisma from "../db.server";
import {OpenAuthInit} from '../auth';
import {ProductEnhancement} from "../Analyzer/ai_analyzer";
import {ProductAnalyzer} from "../Analyzer/product_analyzer";
import {UPDATE_PRODUCT, IMAGE_ALT_UPDATE} from "../Queries/queries";


export async function handleOptimization({
  shop,
  admin,
  productId,
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  const rules = await prisma.businessRuleset.findUnique({
    where: { shop },
  });

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

// 1️⃣ Run only what is enabled
if (rules.titleOptimize) {
  enhanced_title = await enhancement.enhance_title();
}

if (rules.descriptionOptimize) {
  enhanced_description = await enhancement.enhance_description();
}

if (rules.altTextOptimize) {
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
          url: original?.url ?? "https://placehold.it/300x300",
          altText: img.alt,
        };
      }),
    });
  }

  await tx.Optimization.create({
    data: {
      shop,
      productId,
      status: "completed",
    },
  });

  await tx.product.update({
    where: { id: productId },
    data: { optimized: true },
  });
});

  
  return enhanced_alt;
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
    where: { shop:session.shop },
  });

    if (!productContext) {
      throw new Error("No product context found for approval");
    }
    console.log("Product context found for approval:", productId);
    const product = await prisma.product.findUnique({
      where: { shop_shopifyProductId: {
              shop:session.shop,
              shopifyProductId: productId,
            }, },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const productMediasContext = await prisma.productMediaContext.findMany({
      where: { productId: productContext.id },
    });

    // 2️⃣ Build Shopify input and local update payload
    const input = { id: productId };
    const data_update = { optimized: false };

    if (productContext.title) {
      input.title = productContext.title;
      data_update.title = productContext.title;
    }

    if (productContext.description) {
      input.descriptionHtml = productContext.description;
      data_update.description = productContext.description;
    }

    if (productContext.seoDescription) {
      input.seo = { description: productContext.seoDescription };
      data_update.seoDescription = productContext.seoDescription;
    }

    // 3️⃣ Update Shopify product
    const result = await admin.graphql(UPDATE_PRODUCT, { variables: { input } });
    const data = await result.json();

    if (data.data.productUpdate.userErrors.length > 0) {
      console.error(data.data.productUpdate.userErrors);
      throw new Error("Shopify product update failed");
    }

    // 4️⃣ Update Shopify media alt text
    const files = productMediasContext
      .filter((m) => m.altText && m.shopifyMediaId)
      .map((m) => ({ id: m.shopifyMediaId, alt: m.altText }));

    if (files.length > 0) {
      const mediaResult = await admin.graphql(IMAGE_ALT_UPDATE, { variables: { files } });
      const mediaData = await mediaResult.json();

      if (mediaData.data.fileUpdate.userErrors.length > 0) {
        console.error(mediaData.data.fileUpdate.userErrors);
        throw new Error("Shopify media alt update failed");
      }
    }

    // 5️⃣ Persist locally in a single transaction
    await prisma.$transaction(async (tx) => {
      // Update product record
      await tx.product.update({
        where: {
          shop_shopifyProductId: { shopifyProductId: productId, shop: session.shop },
        },
        data: data_update,
      });

      // Delete the used draft context
      await tx.productContext.delete({ where: { id: productContext.id } });

      // Optionally clear productMediaContext alt texts to prevent duplication
      if (productMediasContext.length > 0) {
        await tx.productMedia.updateMany({
          where: { productId },
          data: { altText: null },
        });
      }
    });

    const updatedProduct = await prisma.product.findUnique({ where: { shop_shopifyProductId: { shopifyProductId: productId, shop: session.shop }, } });
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

    await prisma.seoAnalysis.upsert({
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

    return { success: true };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function handleReject({ session, productId }) {

  await prisma.$transaction(async (tx) => {
    // Try to find the product context first
    const context = await tx.productContext.findUnique({
      where: {
        shop_shopifyProductId: {
          shop: session.shop,
          shopifyProductId: productId,
        },
      },
    });


      await tx.productContext.delete({
        where: { id: context.id },
      });
    

    // Update product to mark it as not optimized
    await tx.product.update({
  where: {
    shop_shopifyProductId: {
      shop: session.shop,
      shopifyProductId: productId,
    },
  },
  data: { optimized: false },
});
  });
}

export async function fetchOptimizationJobs({shop}){
  // Return the count of optimization jobs for the given shop (useful for quick frontend display)
  const count = await prisma.optimization.count({ where: { shop } });
  return count;
}