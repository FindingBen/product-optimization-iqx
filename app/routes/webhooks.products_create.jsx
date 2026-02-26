import { authenticate } from "../shopify.server";
import { handleProductCreate } from "../models/Products.server";

export const action = async ({ request }) => {
  const { payload, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await handleProductCreate(shop, payload);

  return new Response();
};