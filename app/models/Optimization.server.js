import prisma from "../db.server";
import {OpenAuthInit} from '../auth';
import {ProductEnhancement} from "../Analyzer/ai_analyzer";
import {UPDATE_PRODUCT, IMAGE_ALT_UPDATE} from "../Queries/queries";


export async function handleOptimization({
  shop,
  admin,
  productId,
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  const images = await prisma.productMedia.findMany({
    where: { productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const rules = await prisma.businessRuleset.findUnique({
    where: { shop },
  });


  const auth = new OpenAuthInit(admin || {});
  const client = await auth.clientAuth();

  const enhancement = new ProductEnhancement(
    client,
    rules,
    product,
    images
  );

  const enhanced_title = await enhancement.enhance_title();
  const enhanced_alt = await enhancement.enhance_alt_text()
  const enhanced_description = await enhancement.enhance_description();
  const enhanced_seo_description = await enhancement.enhance_description();
  console.log('Enhanced alt text:', enhanced_alt);
  await prisma.$transaction(async (tx) => {
const productContext = await tx.productContext.upsert({
  where: {
    shop_shopifyProductId: {
      shop,
      shopifyProductId: product.shopifyProductId,
    },
  },
  update: {
    title: enhanced_title.title,
    description: enhanced_description.description,
    seoDescription: enhanced_seo_description.metaDescription,
  },
  create: {
    shop,
    shopifyProductId: product.shopifyProductId,
    title: enhanced_title.title,
    description: enhanced_description.description,
    seoDescription: enhanced_seo_description.metaDescription,
  },
});

  const createImageAltText = await tx.productMediaContext.createMany({
  data: enhanced_alt.map((img) => {
    // find the original image object by ID
    const original = images.find((i) => i.id === img.id);

    return {
      productId: productContext.id,       // correct foreign key
      url: original?.url || "https://placehold.it/300x300", // fallback if not found
      altText: img.alt,                   // enhanced alt text
    };
  }),
});

  const optimizedJob = await tx.Optimization.create({
    data: {
        shop,
        productId,
        status:"completed"}
  })

  const updateProduct = await tx.product.update({
    where:{id:productId},
    data:{
      optimized: true,
    }
  })
  })

  
  return enhanced_alt;
}

export async function handleApprove({session, productId,admin}){

try {
  const productContext = await prisma.productContext.findUnique({
  where: {
    shop_shopifyProductId: {
          shop: session.shop,
          shopifyProductId: productId,
        }}
  });

  const productMediasContext = await prisma.productMediaContext.findMany({
    where: { productId: productContext.id },
  })

const input = {
  id: productId
};

if(context.title){
  input.title = context.title;

}
if(context.description){
  input.descriptionHtml = context.description;
}if(context.seoDescription){
  input.seo = {
    description: context.seoDescription,
  }
}

  const result = await admin.graphql(UPDATE_PRODUCT, {
    variables: { input },
  });

 const data = await result.json();
console.log('Shopify update response:', result);
  if (data.data.productUpdate.userErrors.length) {
    console.error(data.data.productUpdate.userErrors);
    throw new Error("Shopify product update failed");
  }

  const mediaVariable = {}

  const mediaResult = await admin.graphql(IMAGE_ALT_UPDATE,{
    variables:{}
  })

const updateProduct = await prisma.product.update({
  where:{
    shop_shopifyProductId: {shopifyProductId: productId, shop: session.shop },
  },
  data:{
    optimized:false,
  }
})
console.log('AAAAAAAa')
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