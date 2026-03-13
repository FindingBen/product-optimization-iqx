import prisma from "../db.server";
import {GET_ALL_PRODUCTS,UPDATE_PRODUCT} from "../Queries/queries";
import { updateBusinessRuleset,getBusinessRuleset } from "./BusinessRuleset.server";
import {enqueueOptimization} from "./Automation.server"
import {ProductAnalyzer} from "../Analyzer/product_analyzer";
import {getAdminForShop} from "../shopify.auth"

/**
 * Scan shop products and generate SEO analyses
 */
export async function scanProducts({ session, admin }) {
  const shop = session.shop;
  try {
    console.log("scanProducts called", { shop });
    // 1️⃣ Fetch active products (first 50 for MVP)
    const response = await admin.graphql( GET_ALL_PRODUCTS, {variables: { first: 50 } });
    const json = await response.json();

    if (json.errors) {
    console.error("Shopify GraphQL errors:", JSON.stringify(json.errors, null, 2));
    } 
    // Defensive: log structure
    if (!json.data) {
      console.error("No data in Shopify response", json);
      throw new Error("No data in Shopify response");
    }
    if (!json.data.products) {
      console.error("No products in Shopify response", json.data);
      throw new Error("No products in Shopify response");
    }
    if (!json.data.products.edges) {
      console.error("No product edges in Shopify response", json.data.products);
      throw new Error("No product edges in Shopify response");
    }

    // Shopify returns products as edges
    const products = json.data.products.edges.map(e => e.node);
    let totalScore = 0;
    let totalCompletenessScore = 0;
    const rules = await getBusinessRuleset(shop);
    if (!rules) {
      throw new Error("Cannot scan products without business ruleset");
    }
    // 2️⃣ Process each product

    for (const p of products) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.upsert({
          where: {
            shop_shopifyProductId: {
              shop,
              shopifyProductId: p.id,
            },
          },
          update: {
            title: p.title,
            description: p.descriptionHtml,
          },
          create: {
            shop,
            shopifyProductId: p.id,
            title: p.title,
            description: p.descriptionHtml,
          },
        });


        const images =
  p.media?.edges
    ?.filter(edge => edge.node?.id && edge.node?.image)
    ?.map(edge => ({
      mediaId: edge.node.id,                // ✅ Correct MediaImage GID
      url: edge.node.image.url,
      altText: edge.node.image.altText,
    })) || [];
        if (images.length > 0) {
          await tx.productMedia.createMany({
            data: images.map((img) => ({
              productId: product.id,
              shopifyMediaId: img.mediaId,
              url: img.url,
              altText: img.altText,
            })),
          });
        }

        const analyzer = new ProductAnalyzer(
          {
            id: product.id,
            title: p.title,
            description: p.descriptionHtml,
            parentImages: images,
            variantImages: []
          },
          rules
        );

        const analysis = analyzer.analyze();

        totalScore += analysis.scores.seo;
        totalCompletenessScore += analysis.scores.completeness;
        await tx.seoAnalysis.create({
          data: {
            product: {
              connect: { id: product.id },
            },
            score: analysis.scores.seo,
            completeness: Math.min(analysis.scores.completeness, 100),
          },
        });
      });
    }

    await updateBusinessRuleset({ shop: session.shop, productScan: true });
    return {
      totalProducts: products.length,
      averageScore:
        products.length > 0
          ? Math.round(totalScore / products.length)
          : 0,
      averageCompleteness:
        products.length > 0
          ? Math.round(Math.min(totalCompletenessScore / products.length, 100))
          : 0,
    };
    }
   catch (err) {

  console.error("Non-Response error:", err);
  throw err;
}
}


export async function deleteProducts({session, admin}){
  const shop = session.shop;

  const response = await prisma.product.deleteMany({
    where:{
      shop
    }
  })

  return response;

}

export async function handleProductCreate(shop, payload) {

  const admin = await getAdminForShop(shop);
  const shopifyProductId = payload.admin_graphql_api_id.toString();
  console.log("DATAAA",payload)
  const rules = await getBusinessRuleset(shop);

  const product = await prisma.$transaction(async (tx) => {

    const product = await tx.product.upsert({
      where: {
        shop_shopifyProductId: {
          shop,
          shopifyProductId,
        },
      },
      update: {
        title: payload.title,
        description: payload.body_html,
      },
      create: {
        shop,
        shopifyProductId,
        title: payload.title,
        description: payload.body_html,
      },
    });

    if (payload.media?.length) {
  await tx.productMedia.createMany({
    data: payload.media.map((media) => {
      return {
        productId: product.id,
        shopifyMediaId: media.admin_graphql_api_id, // correct MediaImage id
        url: media?.preview_image.src ?? null,
        altText: media.alt ?? null,
      };
    }),
  });
}

    const images = (payload.images || []).map((img) => ({
      url: img.src,
      altText: img.alt ?? null,
    }));

    const analyzer = new ProductAnalyzer(
      {
        id: product.id,
        title: payload.title,
        description: payload.body_html,
        parentImages: images,
        variantImages: [],
      },
      rules
    );

    const analysis = analyzer.analyze();

    await tx.seoAnalysis.create({
      data: {
        product: { connect: { id: product.id } },
        score: analysis.scores.seo,
        completeness: Math.min(analysis.scores.completeness, 100),
      },
    });


    return product

  });

  const automations = await prisma.automationRule.findMany({
    where: {
      shop,
      enable: true
    }
  });
  if (automations.length === 0) {
  console.log("No enabled automation rules found, skipping optimization");
  return;
}

// Create automation runs
const runsData = automations.map(rule => ({
  shop,
  productId: product.id,
  ruleId: rule.id,
  status: "pending"
}));
await prisma.automationRun.createMany({ data: runsData });

for (const rule of automations) {
  await enqueueOptimization(shop,
    product.id);
}
}


export async function handleProductUpdate(shop, payload) {
  const created = new Date(payload.created_at);
  const updated = new Date(payload.updated_at);

  const diffSeconds = (updated - created) / 1000;

  if (diffSeconds < 3) {
    console.log("Skipping auto-update triggered after product creation");
    return;
  }
  const shopifyProductId = payload.admin_graphql_api_id.toString();
  const rules = await getBusinessRuleset(shop);
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.upsert({
      where: {
        shop_shopifyProductId: {
          shop,
          shopifyProductId,
        },
      },
      update: {
        title: payload.title,
        description: payload.body_html,
      },
      create: {
        shop,
        shopifyProductId,
        title: payload.title,
        description: payload.body_html,
      },
    });

    // Replace media for this product context with the latest images (handles alt text changes)
    await tx.productMedia.deleteMany({ where: { productId: product.id } });
       
    if (payload.media?.length) {
  await tx.productMedia.createMany({
    data: payload.media.map((media) => {
    

      return {
        productId: product.id,
        shopifyMediaId: media.admin_graphql_api_id,
        url: media?.preview_image.src ?? null,
        altText: media.alt ?? null,
      };
    }),
  });
}

    const images = (payload.images || []).map((img) => ({ url: img.src, altText: img.alt ?? null }));

    const analyzer = new ProductAnalyzer(
      {
        id: product.id,
        title: payload.title,
        description: payload.body_html,
        parentImages: images,
        variantImages: [],
      },
      rules
    );

    const analysis = analyzer.analyze();

    await tx.seoAnalysis.create({
      data: {
        product: {
          connect: { id: product.id },
        },
        score: analysis.scores.seo,
        completeness: Math.min(analysis.scores.completeness, 100),
      },
    });
  });

}

export async function handleProductDelete(shop, payload) {
      const shopifyProductId = payload.id?.toString();

      await prisma.$transaction(async (tx) => {
        // Try multiple id formats: raw numeric id, GraphQL gid, or any stored id that contains the numeric id
        const numericId = shopifyProductId;
        const gid = numericId ? `gid://shopify/Product/${numericId}` : null;

        const product = await tx.product.findFirst({
          where: {
            shop,
            OR: [
              { shopifyProductId: numericId },
              ...(gid ? [{ shopifyProductId: gid }] : []),
              { shopifyProductId: { contains: numericId } },
            ],
          },
        });

        if (!product) {
          console.warn(`handleProductDelete: no product found for shop=${shop} id=${shopifyProductId}`);
          return;
        }

        const productId = product.id;

        // Remove analyses
        await tx.seoAnalysis.deleteMany({ where: { productId } });

        await tx.productMedia.deleteMany({ where: { productId: product.id } });

        // Finally remove product record
        await tx.product.deleteMany({ where: { id: productId } });
      });
}

export async function handleUpdateProductShopify(admin, session, productId){
  const productPayload = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!productPayload) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Ensure we pass a GraphQL global id (gid://shopify/Product/...) to the API
  const rawShopifyId = productPayload.shopifyProductId || "";
  const productGid = rawShopifyId.startsWith("gid://")
    ? rawShopifyId
    : `gid://shopify/Product/${rawShopifyId}`;

  const input = {
    id: productGid,
    title: productPayload.title,
    descriptionHtml: productPayload.description ?? null,
    seo: {
      title: productPayload.title ?? null,
      description: productPayload.seoDescription ?? null,
    },
  };

  // Call Shopify Admin GraphQL
  const response = await admin.graphql(UPDATE_PRODUCT, { variables: { input } });

  // Response shape: { productUpdate: { product, userErrors } }
  const payload = response?.data?.productUpdate ?? response?.productUpdate ?? response;
  const userErrors = payload?.userErrors ?? [];
  if (userErrors.length > 0) {
    console.warn("shopify productUpdate userErrors:", userErrors);
    return { success: false, errors: userErrors };
  }

  return { success: true, product: payload.product };
}


function extractMetaDescription(html) {
  if (!html) return null;

  const stripped = html.replace(/<[^>]*>?/gm, "");
  return stripped.substring(0, 160);
}


function normalizeProductId(id) {
  if (String(id).startsWith("gid://")) {
    return id;
  }
  return `gid://shopify/Product/${id}`;
}