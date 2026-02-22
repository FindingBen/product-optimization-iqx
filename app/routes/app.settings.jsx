import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useEffect, useState } from "react";
import BusinessRulesetComponent from "../components/businessRulesetComponent";
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
        {/* === */}
        {/* Store Information */}
        {/* === */}
        <s-section heading="Store Information">
          <s-text-field
            label="Store name"
            name="store-name"
            value="Puzzlify Store"
            placeholder="Enter store name"
          />
          <s-text-field
            label="Business address"
            name="business-address"
            value="123 Main St, Anytown, USA"
            placeholder="Enter business address"
          />
          <s-text-field
            label="Store phone"
            name="store-phone"
            value="+1 (555) 123-4567"
            placeholder="Enter phone number"
          />
          <s-choice-list label="Primary currency" name="currency">
            <s-choice value="usd" selected>
              US Dollar ($)
            </s-choice>
            <s-choice value="cad">Canadian Dollar (CAD)</s-choice>
            <s-choice value="eur">Euro (€)</s-choice>
          </s-choice-list>
        </s-section>

        {/* === */}
        {/* Notifications */}
        {/* === */}
        <s-section heading="Notifications">
          <s-select
            label="Notification frequency"
            name="notification-frequency"
          >
            <s-option value="immediately" selected>
              Immediately
            </s-option>
            <s-option value="hourly">Hourly digest</s-option>
            <s-option value="daily">Daily digest</s-option>
          </s-select>
          <s-choice-list
            label="Notification types"
            name="notifications-type"
            multiple
          >
            <s-choice value="new-order" selected>
              New order notifications
            </s-choice>
            <s-choice value="low-stock">Low stock alerts</s-choice>
            <s-choice value="customer-review">
              Customer review notifications
            </s-choice>
            <s-choice value="shipping-updates">Shipping updates</s-choice>
          </s-choice-list>
        </s-section>

        {/* === */}
        {/* Preferences */}
        {/* === */}
        <s-section heading="Ruleset">
  {businessRuleset ? (
    <>
      <BusinessRulesetComponent businessData={businessRuleset} onSave={handleUpdateRuleset}/>
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