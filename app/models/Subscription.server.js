import prisma from "../db.server";
import { SUBSCRIPTION_CHARGE } from "../Queries/queries"

// Called on every app load — ensures every store has a subscription row
export async function getOrCreateSubscription(shop) {
  return prisma.shopSubscription.upsert({
    where: { shop },
    update: {},
    create: {
      shop,
      planName: "free",
      status: "active",
      billingCycleStart: new Date(),
    },
    select: {
    shop: true,
    planName: true,
    nextPlanName: true,
    billingCycleStart: true,
    optimizationsUsedThisCycle: true,
    billingCycleEnd: true,
    plan: true,
  },
  });
}

// Full subscription + plan for a shop
export async function getSubscription(shop) {
  await enforceBillingCycle(shop);

  return prisma.shopSubscription.findUnique({
    where: { shop },
    include: { plan: true },
  });
}

// Check if shop can run an optimization
export async function canOptimize(shop) {
  const sub = await getSubscription(shop);

  if (!sub || sub.status !== "active") {
    return { allowed: false, reason: "No active subscription" };
  }

  const limit = sub.plan.monthlyOptimizationLimit;

  if (limit === -1) return { allowed: true };

  if (sub.optimizationsUsedThisCycle >= limit) {
    return {
      allowed: false,
      reason: `Monthly limit of ${limit} optimizations reached`,
    };
  }

  return { allowed: true };
}

// Check if shop can use automations
export async function canUseAutomations(shop) {
  const sub = await getSubscription(shop);
  if (!sub || sub.status !== "active") return { allowed: false };
  return { allowed: sub.plan.automationsAllowed };
}

// Check if shop can create another automation rule
export async function canCreateAutomationRule(shop) {
  const sub = await getSubscription(shop);
  if (!sub?.plan.automationsAllowed) return { allowed: false, reason: "Upgrade to use automations" };

  const max = sub.plan.maxAutomationRules;
  if (max === -1) return { allowed: true };

  const existing = await prisma.automationRule.count({ where: { shop } });
  if (existing >= max) return { allowed: false, reason: `Plan allows max ${max} automation rules` };

  return { allowed: true };
}

// Increment usage counter after a successful optimization
export async function incrementOptimizationUsage(shop) {
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      optimizationsUsedThisCycle: { increment: 1 },
    },
  });
}


// Initiate Shopify subscription charge — returns confirmationUrl
export async function createShopifySubscription(admin, shop, planName) {
  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan || plan.price === 0) throw new Error("Invalid paid plan");

  const returnUrl = buildAdminEmbeddedReturnUrl(
    shop,
    "/app/plans/confirm" // this should be the in-app route you want
  );

  const response = await admin.graphql(SUBSCRIPTION_CHARGE, {
    variables: {
      name: `ProductIQX ${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}`,
      returnUrl,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: plan.price, currencyCode: "USD" },
              interval: "EVERY_30_DAYS",
            },
          },
        },
      ],
    },
  });

  const { data } = await response.json();
  const result = data.appSubscriptionCreate;

  if (result.userErrors?.length) {
    throw new Error(result.userErrors[0].message);
  }

  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      nextPlanName: planName,
      status: "pending",
      shopifySubscriptionId: result.appSubscription.id,
      shopifyConfirmationUrl: result.confirmationUrl,
    },
  });

  return result.confirmationUrl;
}

export async function activateSubscription(shop, shopifySubscriptionId) {
  const now = new Date();

  const sub = await prisma.shopSubscription.findUnique({
    where: { shop },
  });

  const nextPlan = sub.nextPlanName || sub.planName;

  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      status: "active",
      shopifySubscriptionId,

      // ✅ apply scheduled plan
      planName: nextPlan,
      nextPlanName: null,

      billingCycleStart: now,
      billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),

      optimizationsUsedThisCycle: 0,
    },
  });
}

export async function cancelSubscription(shop){
  const sub = await prisma.shopSubscription.update({
    where: { shop },
    data: {
      nextPlanName: null,
      billingCycleEnd: null,
    },
  });
}

export async function downgradeToFree(shop) {
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      nextPlanName: "free", // ✅ schedule downgrade
    },
  });
}


function buildAdminEmbeddedReturnUrl(shop, path) {

  const storeHandle = shop.replace(".myshopify.com", "");

  // This is the pattern Shopify shows in docs:
  // https://admin.shopify.com/store/{store-handle}/apps/{your-app-handle}/{your-path}
  return `https://admin.shopify.com/store/${storeHandle}/apps/${process.env.SHOPIFY_APP_HANDLE}${path}`;
}

async function enforceBillingCycle(shop) {
  const sub = await prisma.shopSubscription.findUnique({
    where: { shop },
  });

  if (!sub || !sub.billingCycleEnd) return sub;

  const now = new Date();

  if (now < sub.billingCycleEnd) return sub;

  // 🔁 Cycle expired → rotate
  const nextPlan = sub.nextPlanName || sub.planName;

  return prisma.shopSubscription.update({
    where: { shop },
    data: {
      planName: nextPlan,
      nextPlanName: null,
      optimizationsUsedThisCycle: 0,
      billingCycleStart: now,
      billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    include: { plan: true },
  });
}