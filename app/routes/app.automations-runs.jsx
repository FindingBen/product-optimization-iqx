import { useLoaderData,redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { loadAutomationRuns } from "../models/Automation.server";
import { getOrCreateSubscription  } from "../models/Subscription.server";
import AutomationRunsTable from "../components/automationRunsTable";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const runs = await loadAutomationRuns(session);
  const subscription = await getOrCreateSubscription(session.shop);
  if (!subscription || subscription.planName === "free") {
    console.log('PLAN',subscription)
    throw redirect("/app/plans");
  }
  return { runs,subscription };
};

export default function AutomationRunsPage() {
  const { runs, subscription } = useLoaderData();

  console.log('PLAN',subscription)
  return (
    <s-page heading="Automation Runs">
      <AutomationRunsTable runs={runs} />
    </s-page>
  );
}