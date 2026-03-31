
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const chargeId = url.searchParams.get("charge_id");
  const { session, redirect } = await authenticate.admin(request);
  

  return redirect('/app/plans');
};
