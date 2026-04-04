import { useState, useEffect } from "react";
import CreateAutomationModal from "../components/modals/automationCreateModal"
import EditAutomationModal  from "../components/modals/automationsEditModal"
import AutomationTable from "../components/automationTable"
import { authenticate } from "../shopify.server";
import { useFetcher, useNavigate, useLoaderData, redirect,useRevalidator } from "react-router";
import {getAutomationSettings, createAutomationRule,loadAutomations, updateAutomation} from "../models/Automation.server"
import { getOrCreateSubscription  } from "../models/Subscription.server";
import { getBusinessRuleset } from "../models/BusinessRuleset.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const businessRuleset = await getBusinessRuleset(session.shop);
  if (!businessRuleset) {
    throw redirect("/app");
  }
  const automationSettings = await getAutomationSettings(session);
  const automations = await loadAutomations(session);
  const subscription = await getOrCreateSubscription(session.shop);
  if (!subscription || subscription.planName === "Free") {
    throw redirect("/app/plans");
  }
 const allRuns = automations.flatMap((a) => a.runs);
const totalRuns = allRuns.length;
const completedRuns = allRuns.filter((r) => r.status === "completed").length;
const failedRuns = allRuns.filter((r) => r.status === "failed").length;
const finishedRuns = completedRuns + failedRuns; // exclude pending/running

const successRate = finishedRuns > 0 ? ((completedRuns / finishedRuns) * 100).toFixed(1) : 0;
const failRate = finishedRuns > 0 ? ((failedRuns / finishedRuns) * 100).toFixed(1) : 0;


  return {
    automationSettings,
    automations,
    stats: {
    total: automations.length,
    totalRuns,
    completedRuns,
    failedRuns,
    successRate,
    failRate,
  }
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createAutomation") {

    const fields = {
      title: formData.get("title") === "true",
      description: formData.get("description") === "true",
      alt: formData.get("alt") === "true",
      seo: formData.get("seo") === "true"
    };

    await createAutomationRule(session, fields);

    return { success: true };
  }
  else if (intent === "toggleAutomation"){
     const automationId = formData.get("automationId");
     const fields = {
      enable: formData.get("enabled") === "true",
      
    };

    await updateAutomation(fields,automationId)
  }
  else if (intent === "updateAutomation") {
    const automationId = formData.get("automationId");
    await updateAutomation({
      optimizeTitle: formData.get("optimizeTitle") === "true",
      optimizeDescription: formData.get("optimizeDescription") === "true",
      optimizeAltText: formData.get("optimizeAltText") === "true",
      optimizeSeo: formData.get("optimizeSeo") === "true",
    }, automationId);
    return { success: true };
  }

  return null;
};

export default function AutomationPage() {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { automationSettings, automations, stats } = useLoaderData(); // ← add stats
  const navigate = useNavigate();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data]);


console.log('AA',editingAutomation)
  return (
    <s-page heading="Automations">

      {/* Stats Section */}
      <s-section padding="base">
        <s-grid
          gridTemplateColumns="@container (inline-size <= 250px) 1fr, 1fr auto 1fr auto 1fr"
          gap="small"
        >
          <s-clickable href="#" paddingBlock="small-400" paddingInline="small-100" borderRadius="base">
            <s-grid gap="small-300">
              <s-heading>Total Automations</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{stats.total}</s-text>   {/* ← real value */}
                <s-badge tone="success" icon="arrow-up">0</s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>

          <s-divider direction="block" />

          <s-clickable href="#" paddingBlock="small-200" paddingInline="small-100" borderRadius="base">
            <s-grid gap="small-300">
              <s-heading>Successful Runs</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{stats.successRate}%</s-text>   {/* ← real value */}
                <s-badge tone={stats.successRate >= 50 ? "success" : "critical"}>
                  {stats.completedRuns} of {stats.totalRuns}
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>

          <s-divider direction="block" />

          <s-clickable href="#" paddingBlock="small-200" paddingInline="small-100" borderRadius="base">
            <s-grid gap="small-300">
              <s-heading>Failed Runs</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{stats.failRate}%</s-text>   {/* ← real value */}
                <s-badge tone={stats.failRate > 0 ? "critical" : "success"}>
                  {stats.failedRuns} of {stats.totalRuns}
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
        </s-grid>
      </s-section>

      {/* Empty State */}
      {automations.length === 0 && (
        <s-section>
          <s-card>
            <s-stack vertical alignment="center" gap="loose">
              <h2>No automations yet</h2>
              <p>Automatically optimize product titles, descriptions, SEO, and image alt text using AI.</p>
              <s-button variant="primary" onClick={() => setShowModal(true)}>
                Add Automation
              </s-button>
            </s-stack>
          </s-card>
        </s-section>
      )}

      {/* Table — automations now include runs array */}
      {automations.length > 0 && (
         <AutomationTable
            automations={automations}
            onEdit={(automation) => setEditingAutomation(automation)}  // ← pass handler
          />
      )}

      {showModal && (
        <CreateAutomationModal close={() => setShowModal(false)} showModal={showModal} />
      )}

      {editingAutomation && (
        <EditAutomationModal
          automation={editingAutomation}
          close={() => setEditingAutomation(null)}
          showModal={!editingAutomation}
        />
      )}

    </s-page>
  );
}