import db from "../db.server";
import prisma from "../db.server";

export async function getBusinessRuleset(shop) {
  const ruleset = await prisma.businessRuleset.findUnique({
    where: { shop },
    select: {
      id: true,
      shop: true,
      storeDescription: true,
      productScan: true,
      productNameRule: true,
      productDescriptionRule: true,
      productImageRule: true,
      productVariantRule: true,
      productTagRule: true,
      productAltImageRule: true,
      keywords: true,
      minTitleLength: true,
      maxTitleLength: true,
      productDescriptionTemplate: true,
      minDescriptionLength: true,
      maxDescriptionLength: true,
      maxAltDescLength: true,
      minImages: true,
      requiresAltText: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return ruleset
}

export async function createBusinessRuleset({ shop, ...data }) {
  return db.businessRuleset.upsert({
    where: { shop },
    update: {
      ...data,
    },
    create: {
      shop,
      ...data,
    },
  });
}

export async function updateBusinessRuleset({ shop, ...data}){
  return db.businessRuleset.update({
    where:{
      shop    },
    data:{
      ...data
    }
  })
}

export async function deleteBusinessRuleset(shop) {
  return prisma.businessRuleset.delete({
    where: { shop },
  });
}
