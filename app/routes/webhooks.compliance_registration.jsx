// app/routes/webhooks/compliance_registration.jsx
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "../db.server"

// Manual HMAC verification for compliance webhooks
function verifyHmac(request, rawBody) {
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader) {
    console.error("[compliance] Missing HMAC header");
    return false;
  }

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error("[compliance] Missing SHOPIFY_API_SECRET");
    return false;
  }

  const generated = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const hmacBuffer = Buffer.from(hmacHeader, "base64");
  const generatedBuffer = Buffer.from(generated, "base64");

  if (hmacBuffer.length !== generatedBuffer.length) return false;

  return timingSafeEqual(hmacBuffer, generatedBuffer); // ← use imported function directly
}

export const action = async ({ request }) => {
  // Read raw body BEFORE parsing — needed for HMAC
  const rawBody = await request.text();

  // Verify HMAC signature
  const isValid = verifyHmac(request, rawBody);
  if (!isValid) {
    console.error("[compliance] Invalid HMAC signature — request rejected");
    return new Response("Unauthorized", { status: 401 });
  }

  const topic = request.headers.get("X-Shopify-Topic");
  const shop = request.headers.get("X-Shopify-Shop-Domain");
  const payload = JSON.parse(rawBody);

  console.log(`[compliance] ${topic} → shop:${shop}`);

  switch (topic) {
    case "customers/data_request":
      console.log(`[compliance] Data request for customer ${payload.customer?.id} — no customer data stored`);
      break;

    case "customers/redact":
      console.log(`[compliance] Redact request for customer ${payload.customer?.id} — no customer data stored`);
      break;

    case "shop/redact":
      console.log(`[compliance] Shop redact → deleting all data for ${shop}`);
      try {
        await prisma.automationResult.deleteMany({
          where: { run: { shop } },
        });
        await prisma.automationRun.deleteMany({ where: { shop } });
        await prisma.automationRule.deleteMany({ where: { shop } });
        await prisma.automationSettings.deleteMany({ where: { shop } });
        await prisma.seoAnalysis.deleteMany({
          where: { product: { shop } },
        });
        await prisma.productMediaContext.deleteMany({
          where: { product: { shop } },
        });
        await prisma.productContext.deleteMany({ where: { shop } });
        await prisma.productMedia.deleteMany({
          where: { product: { shop } },
        });
        await prisma.optimization.deleteMany({ where: { shop } });
        await prisma.product.deleteMany({ where: { shop } });
        await prisma.shopSubscription.deleteMany({ where: { shop } });
        await prisma.businessRuleset.deleteMany({ where: { shop } });
        await prisma.analytics.deleteMany({ where: { shop } });
        await prisma.session.deleteMany({ where: { shop } });

        console.log(`[compliance] Shop redact complete → ${shop}`);
      } catch (err) {
        console.error(`[compliance] Shop redact error → ${shop}`, err);
      }
      break;

    default:
      console.log(`[compliance] Unhandled topic: ${topic}`);
  }

  return new Response(null, { status: 200 });
};