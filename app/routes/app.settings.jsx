import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useEffect, useState } from "react";
import BusinessRulesetComponent from "../components/businessRulesetComponent";
import OptimizationSettings from "../components/optimizationSettings";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { getBusinessRuleset } = await import(
    "../models/BusinessRuleset.server"
  );
  const businessRuleset = await getBusinessRuleset(session.shop);

  return { businessRuleset: businessRuleset,};
};

export const action = async ({request}) =>{
   const { deleteBusinessRuleset,updateBusinessRuleset } = await import(
      "../models/BusinessRuleset.server"
    );
  const formdata = await request.formData();
  const intent = formdata.get("intent");
  if(intent === "deleteRuleset"){
    const { session } = await authenticate.admin(request);
    await deleteBusinessRuleset(session.shop);
    return { success: true };
  }
  else if (intent === "updateRuleset") {
  const { session } = await authenticate.admin(request);

  const raw = Object.fromEntries(formdata);

  // Remove routing/meta keys before passing to model
  delete raw.intent;
  delete raw.id;
  delete raw.createdAt;
  delete raw.updatedAt;

  await updateBusinessRuleset({
    shop: session.shop,
    ...raw,
  });

  return { success: true };
}

}

export default function Settings(){
  const fetcher = useFetcher();
  fetcher.state === "submitting" &&
  fetcher.formData?.get("intent") === "deleteRuleset";
  const {
  businessRuleset
} = useLoaderData();
const revalidator = useRevalidator();

useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.success) {
    revalidator.revalidate();
  }
}, [fetcher.state, fetcher.data]);


const handleUpdateRuleset = (updatedData) => {
    const formData = new FormData();

    formData.append("intent", "updateRuleset");

    Object.entries(updatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    fetcher.submit(formData, { method: "post" });
  };

    return(
        <form method="post" data-save-bar>
 
  <input type="hidden" name="intent" value="updateRuleset" />
      <s-page heading="Settings" inlineSize="small">
        <OptimizationSettings businessRuleset={businessRuleset} />

        <s-section heading="Ruleset">
  {businessRuleset ? (
    <>
      <BusinessRulesetComponent businessData={businessRuleset}/>
      <fetcher.Form method="post" style={{ marginTop: '1rem' }}>
        <input type="hidden" name="intent" value="deleteRuleset" />
        <s-button tone="critical" variant="secondary" type="submit">
          Delete ruleset
        </s-button>
      </fetcher.Form>
    </>
  ) : (
    <s-box padding="base" background="subdued" borderRadius="medium">
      <s-text variant="bodyMd" color="subdued">
        No business ruleset configured yet.
      </s-text>
    </s-box>
  )}
</s-section>
        <s-section heading="Tools">
          <s-stack
            gap="none"
            border="base"
            borderRadius="base"
            overflow="hidden"
          >
            <s-box padding="small-100">
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Reset app settings</s-heading>
                  <s-paragraph color="subdued">
                    Reset all settings to their default values. This action
                    cannot be undone.
                  </s-paragraph>
                </s-box>
                <s-button tone="critical">Reset</s-button>
              </s-grid>
            </s-box>
            <s-box paddingInline="small-100">
              <s-divider />
            </s-box>

            <s-box padding="small-100">
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Export settings</s-heading>
                  <s-paragraph color="subdued">
                    Download a backup of all your current settings.
                  </s-paragraph>
                </s-box>
                <s-button>Export</s-button>
              </s-grid>
            </s-box>
          </s-stack>
      </s-section>
  </s-page>
</form>
    )
}