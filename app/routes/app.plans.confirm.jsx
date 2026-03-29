
import { activateSubscription } from "../models/Subscription.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const chargeId = url.searchParams.get("charge_id");
   const { session, redirect } = await authenticate.admin(request);

  if (chargeId) {
    await activateSubscription(session.shop, chargeId);
  }


  return redirect('/app/plans');
};