// app/routes/webhooks.app-subscriptions-update.jsx
import { authenticate } from "../shopify.server";
import { activateSubscription, downgradeToFree } from "../models/Subscription.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`[webhook] ${topic} → shop:${shop}`);
  console.log(`[webhook] payload:`, JSON.stringify(payload, null, 2));

  const subscription = payload.app_subscription;
  const shopifySubscriptionId = subscription?.admin_graphql_api_id;
  const status = subscription?.status;

  // Fetch current stored subscription to compare IDs
  const storedSub = await prisma.shopSubscription.findUnique({
    where: { shop },
  });

  console.log(`[webhook] incoming id: ${shopifySubscriptionId} | stored id: ${storedSub?.shopifySubscriptionId}`);

  // Ignore webhooks for old/previous subscription IDs
  // Exception: ACTIVE events should always be processed (new subscription activating)
  if (
    status !== "ACTIVE" &&
    storedSub?.shopifySubscriptionId &&
    storedSub.shopifySubscriptionId !== shopifySubscriptionId
  ) {
    console.log(`[webhook] Skipping stale subscription event → ${shopifySubscriptionId} (status: ${status})`);
    return new Response(null, { status: 200 });
  }

  switch (status) {
    case "ACTIVE":
      await activateSubscription(shop, shopifySubscriptionId);
      console.log(`[webhook] Subscription activated → ${shop}`);
      break;

    case "CANCELLED":
    case "DECLINED":
    case "EXPIRED": {
      // Re-fetch to get latest nextPlanName (may have changed since initial fetch)
      const currentSub = await prisma.shopSubscription.findUnique({
        where: { shop },
      });

      if (currentSub?.nextPlanName) {
        // Scheduled downgrade — the cycle ended, apply the queued plan change
        await prisma.shopSubscription.update({
          where: { shop },
          data: {
            planName: currentSub.nextPlanName,
            nextPlanName: null,
            status: "active",
            shopifySubscriptionId: null,
            shopifyConfirmationUrl: null,
            optimizationsUsedThisCycle: 0,
            billingCycleStart: new Date(),
            billingCycleEnd: null,
          },
        });
        console.log(`[webhook] Scheduled downgrade applied → ${shop} now on ${currentSub.nextPlanName}`);
      } else {
        // No scheduled change — genuine cancellation/expiry, drop to free
        await downgradeToFree(shop);
        console.log(`[webhook] Subscription ended (${status}) → ${shop} downgraded to free`);
      }
      break;
    }

    case "FROZEN":
      await prisma.shopSubscription.update({
        where: { shop },
        data: { status: "frozen" },
      });
      console.log(`[webhook] Subscription frozen → ${shop}`);
      break;

    default:
      console.log(`[webhook] Unhandled status: ${status}`);
  }

  return new Response(null, { status: 200 });
};