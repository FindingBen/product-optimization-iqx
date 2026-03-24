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
    include: { plan: true },
  });
}

// Full subscription + plan for a shop
export async function getSubscription(shop) {
  return prisma.shopSubscription.findUnique({
    where: { shop },
    include: { plan: true },
  });
}

// Check if shop can run an optimization
export async function canOptimize(shop) {
  const sub = await getSubscription(shop);
  if (!sub || sub.status !== "active") return { allowed: false, reason: "No active subscription" };

  const limit = sub.plan.monthlyOptimizationLimit;
  if (limit === -1) return { allowed: true }; // unlimited

  if (sub.optimizationsUsedThisCycle >= limit) {
    return { allowed: false, reason: `Monthly limit of ${limit} optimizations reached` };
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
    data: { optimizationsUsedThisCycle: { increment: 1 } },
  });
}

// Reset usage counter — call this on billing cycle renewal webhook
export async function resetBillingCycle(shop) {
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      optimizationsUsedThisCycle: 0,
      billingCycleStart: new Date(),
    },
  });
}

// Initiate Shopify subscription charge — returns confirmationUrl
export async function createShopifySubscription(admin, shop, planName) {
  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan || plan.price === 0) throw new Error("Invalid paid plan");

  const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/plans/confirm?shop=${shop}&plan=${planName}`;

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

  // Save pending subscription
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      planName,
      status: "pending",
      shopifySubscriptionId: result.appSubscription.id,
      shopifyConfirmationUrl: result.confirmationUrl,
    },
  });

  return result.confirmationUrl;
}

// Called after Shopify redirects back with confirmed charge
export async function activateSubscription(shop, shopifySubscriptionId) {
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      status: "active",
      shopifySubscriptionId,
      optimizationsUsedThisCycle: 0,
      billingCycleStart: new Date(),
    },
  });
}

// Downgrade to free (on cancel/expiry)
export async function downgradeToFree(shop) {
  await prisma.shopSubscription.update({
    where: { shop },
    data: {
      planName: "free",
      status: "active",
      shopifySubscriptionId: null,
      shopifyConfirmationUrl: null,
      optimizationsUsedThisCycle: 0,
      billingCycleStart: new Date(),
    },
  });
}