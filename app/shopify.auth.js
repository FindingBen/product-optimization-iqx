import { unauthenticated } from "./shopify.server.js";


export async function getAdminForShop(shop) {
  const sessionId = `offline_${shop}`;
  const { admin, session } = await unauthenticated.admin(shop);


  if (!session) {
    throw new Error(`No offline session found for ${shop}`);
  }


   return { admin, session };
}