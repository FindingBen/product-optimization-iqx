import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useEffect, useState } from "react";
import  {getAutomationSettings,createAutomationSettings} from "../models/Automation.server";
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

  const automationsettings = await getAutomationSettings(session)

  return { businessRuleset: businessRuleset,automationsettings: automationsettings};
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
else if(intent === 'createAutomationSettings'){
  const { session } = await authenticate.admin(request);

  await createAutomationSettings(session.shop)

  return { success: true };
}

}

export default function Settings(){
  const fetcher = useFetcher();
  fetcher.state === "submitting" &&
  fetcher.formData?.get("intent") === "deleteRuleset";
  const {
  businessRuleset,
  automationsettings

} = useLoaderData();
const revalidator = useRevalidator();

const [automationEnabled, setAutomationEnabled] = useState(
  automationsettings?.enabled ?? false
);

useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.success) {
    revalidator.revalidate();
  }
}, [fetcher.state, fetcher.data]);


const handleAutomationToggle = (checked) => {
  setAutomationEnabled(checked);

  const formData = new FormData();
  formData.append("intent", "createAutomationSettings");
  formData.append("enabled", checked);

  fetcher.submit(formData, { method: "post" });
};

    return(
        <fetcher.Form method="post" data-save-bar>
 
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
        {/* <s-section heading="Automation">
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
                  <s-heading>Automation settings</s-heading>
                  <s-paragraph color="subdued">
                    Enable automations
                  </s-paragraph>
                </s-box>
                <s-switch
                  label="Enable"
                  checked={automationEnabled}
                  onChange={(e) => handleAutomationToggle(e.target.checked)}
                  details="Ensure all criteria are met before enabling"
                />
              </s-grid>
            </s-box>
            
          </s-stack>
      </s-section> */}
  </s-page>
</fetcher.Form>
    )
}