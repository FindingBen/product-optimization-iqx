import db from "../db.server";
import prisma from "../db.server";

export async function getBusinessRuleset(shop) {
  const businessRuleset = await db.businessRuleset.findFirst({ where: { shop } });
  return businessRuleset;
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

export async function deleteBusinessRuleset(shop) {
  return prisma.businessRuleset.delete({
    where: { shop },
  });
}
