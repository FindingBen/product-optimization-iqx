import prisma from "../db.server";
import {OpenAuthInit} from '../auth';
import {ProductEnhancement} from "../Analyzer/ai_analyzer";


export async function handleOptimization({
  shop,
  admin,
  productId,
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  const images = await prisma.productMediaContext.findMany({
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
console.log('Enhanced Alt Text:', enhanced_alt)
console.log('Enhanced Title:', enhanced_title)
console.log('Enhanced Description:', enhanced_description)
console.log('Enhanced SEO Description:', enhanced_seo_description)
  const updateProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      title: enhanced_title.title,
      description: enhanced_description.description,
      seoDescription: enhanced_seo_description.metaDescription,
      optimized: true,
    },
  });

  const updateImageAltText = await prisma.productMediaContext.updateMany({
    where: { productId },
    data: {
      altText: enhanced_alt.alt,
    },
  });

  const optimizedJob = await prisma.Optimization.create({
    data: {
        shop,
        productId,
        status:"completed"}
  })
  return enhanced_title;
}


export async function fetchOptimizationJobs({shop}){
  // Return the count of optimization jobs for the given shop (useful for quick frontend display)
  const count = await prisma.optimization.count({ where: { shop } });
  return count;
}