import { redirect } from "react-router";
import { activateSubscription } from "../models/Subscription.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const shop = url.searchParams.get("shop");
  const chargeId = url.searchParams.get("charge_id");

  if (!shop) {
    throw new Response("Missing shop param", { status: 400 });
  }

  if (chargeId) {
    await activateSubscription(shop, chargeId);
  }

  // 🔥 force a clean OAuth cycle
  return redirect(`/auth?shop=${shop}`);
};