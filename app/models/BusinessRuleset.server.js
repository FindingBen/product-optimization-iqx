import db from "../db.server";
import prisma from "../db.server";
import {GET_SHOPIFY_SHOP_INFO} from "../Queries/queries";
import {Prompting} from "../Analyzer/ai_analyzer";
import {OpenAuthInit} from '../auth';

export async function getBusinessRuleset(shop) {
  const ruleset = await prisma.businessRuleset.findUnique({
    where: { shop },
    select: {
      id: true,
      shop: true,
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

  const shopInfo = await getShopInfo(data.admin);
  const auth = new OpenAuthInit(data.admin || {});
  const client = await auth.clientAuth();
  const initializeProcess = new Prompting({client, data: shopInfo});

  const data_ruleset = await initializeProcess.analyze_business();
  const prompt_ruleset = data_ruleset['recommended_seo_ruleset'];

  return db.businessRuleset.upsert({
    where: { shop },
    update: {
      ...prompt_ruleset,
    },
    create: {
      shop,
      ...prompt_ruleset,
    },
  });
}

export async function updateBusinessRuleset({ shop, ...raw }) {
  const data = {};

  if ("productNameRule" in raw)
    data.productNameRule = raw.productNameRule;

  if ("productDescriptionRule" in raw)
    data.productDescriptionRule = raw.productDescriptionRule;

  if ("productImageRule" in raw)
    data.productImageRule = raw.productImageRule;

  if ("productVariantRule" in raw)
    data.productVariantRule = raw.productVariantRule;

  if ("productTagRule" in raw)
    data.productTagRule = raw.productTagRule;

  if ("productAltImageRule" in raw)
    data.productAltImageRule = raw.productAltImageRule;

  if ("keywords" in raw)
    data.keywords = raw.keywords;

  if ("minImages" in raw && raw.minImages !== "")
    data.minImages = parseInt(raw.minImages);

  if ("requiresAltText" in raw)
    data.requiresAltText =
      raw.requiresAltText === "true" || raw.requiresAltText === true;

  // 🔒 Only update productScan if explicitly sent
  if ("productScan" in raw)
    data.productScan =
      raw.productScan === "true" || raw.productScan === true;

  return db.businessRuleset.update({
    where: { shop },
    data,
  });
}

export async function deleteBusinessRuleset(shop) {
  console.log("Deleting ruleset for shop:", shop);
  return prisma.businessRuleset.delete({
    where: { shop },
  });
}


export async function getShopInfo(admin){
  const response = await admin.graphql(GET_SHOPIFY_SHOP_INFO);
  const json = await response.json();
  const shop_data = json.data
  return shop_data;
}