import { data } from "@remix-run/node";
import prisma from "../db.server";
import {optimizationQueue} from "../Queue/optimizationQueue"


export async function getAutomationSettings(session) {
  try {
    const automationSettings = await prisma.automationSettings.findUnique({
      where: {
        shop: session.shop,
      },
    });

    return automationSettings ?? null;

  } catch (error) {
    console.error(error);
    throw new Response("Automation settings error", { status: 500 });
  }
}

export async function createAutomationSettings(shop) {
  return prisma.automationSettings.upsert({
    where: { shop },
    update: { enabled: true },
    create: {
      shop,
      enabled: true,
    },
  });
}

export async function createAutomationRule(session, fields) {
  return prisma.automationRule.create({
    data: {
      shop: session.shop,
      enable: false,
      optimizeTitle: fields.title,
      optimizeDescription: fields.description,
      optimizeAltText: fields.alt,
      optimizeSeo: fields.seo
    }
  });
}

export async function updateAutomation(fields,automationId){
  return prisma.automationRule.update({
    where:{
    id:automationId
  },data:{
    enable:fields.enable
  }
  })
}

export async function enqueueAutomationJob(session,productId){
  const shop = session.shop
  
  await prisma.optimization.upsert({
  where: {
    productId: productId
  },
  update: {
    status: "queued"
  },
  create: {
    shop,
    productId,
    status: "queued"
  }
});
}

export async function enqueueOptimization(shop, productId) {
 
  const optimization = await prisma.optimization.create({
    data: {
      shop,
      productId,
      status: "queued"
    }
  });

  await optimizationQueue.add("optimize", {
    shop,
    productId,
    optimizationId: optimization.id
  });

  return optimization;
}

export async function loadAutomations(session){
  const automations = await prisma.automationRule.findMany({
  where: { shop: session.shop },
  orderBy: { createdAt: "desc" }
});

return automations
}