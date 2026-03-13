import { useState, useEffect } from "react";
import CreateAutomationModal from "../components/modals/automationCreateModal"
import AutomationTable from "../components/automationTable"
import { authenticate } from "../shopify.server";
import { useFetcher, useNavigate, useLoaderData, redirect,useRevalidator } from "react-router";
import {getAutomationSettings, createAutomationRule,loadAutomations, updateAutomation} from "../models/Automation.server"

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const automationSettings = await getAutomationSettings(session);

  const automations = await loadAutomations(session)

  return { automationSettings,automations };
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

  return null;
};

export default function AutomationPage() {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  
  const [showModal, setShowModal] = useState(false);
  const {automationSettings,automations} = useLoaderData()
  const navigate = useNavigate();
  const stats = {
    total: automations.length,
    products: 0,
    success: 0,
    failed: 0
  };


useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.success) {
    revalidator.revalidate();
  }
}, [fetcher.state, fetcher.data]);
  console.log('AUTOM',automations)
  if (!automationSettings) {
  return (
    <s-page heading="Automations">
      <s-section>
        <s-card>
          <s-stack direction="block" alignment="center" gap="loose">

            <s-heading>You must enable automations first</s-heading>

            <s-text tone="subdued">
              Go to settings and enable automations before creating automation rules.
            </s-text>

            <s-button
              variant="primary"
              onClick={() => navigate("/app/settings")}
            >
              Go to Settings
            </s-button>

          </s-stack>
        </s-card>
      </s-section>
    </s-page>
  );
}

  return (
    <s-page heading="Automations">

      {/* Stats Section */}
      <s-section padding="base">
        <s-grid
          gridTemplateColumns="@container (inline-size <= 250px) 1fr, 1fr auto 1fr auto 1fr"
          gap="small"
        >
          <s-clickable
            href="#"
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Total Automations</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{automations?.length}</s-text>
                <s-badge tone="success" icon="arrow-up">
                  0
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          
          <s-clickable
            href="#"
            paddingBlock="small-200"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Succsesfull automations</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>3.2%</s-text>
                <s-badge tone="critical" icon="arrow-down">
                  0.8%
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-clickable
            href="#"
            paddingBlock="small-200"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Failed Automations</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>0</s-text>
                <s-badge tone="success" icon="arrow-up">
                  0
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

              <p>
                Automatically optimize product titles, descriptions, SEO,
                and image alt text using AI.
              </p>

              <s-button
                variant="primary"
                onClick={() => setShowModal(true)}
              >
                Add Automation
              </s-button>

            </s-stack>
          </s-card>
        </s-section>
      )}

      {/* Table */}
      {automations.length > 0 && (
        <AutomationTable automations={automations}/>
      )}

      {/* Modal */}
      {showModal && <CreateAutomationModal close={() => setShowModal(false)} showModal={showModal} />}

    </s-page>
  );
}