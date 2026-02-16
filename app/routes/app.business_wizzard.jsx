import React, { useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useNavigate,
  useSubmit,
  useParams,
} from "react-router";
import storeInfoComponentStep from "../components/storeInfoComponentStep";
import optimizationChoiceStep from "../components/optimizationChoiceStep";
import { authenticate } from "../shopify.server";
import { createBusinessRuleset } from "../models/BusinessRuleset.server";
import { redirect } from "@remix-run/node";

const steps = [storeInfoComponentStep];

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.json();

  const ruleset = await createBusinessRuleset({
    shop: session.shop,
    storeDescription: formData.storeDescription,
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return redirect("/app");
}


export default function BusinessWizzard(){
    const submit = useSubmit();
  const actionData = useActionData();
    const [currentStep, setCurrentStep] = useState(0);
    const navigation = useNavigation();
const isSubmitting = navigation.state === "submitting";
  const [formData, setFormData] = useState({
  storeDescription: "",
});


const CurrentStepComponent = steps[currentStep];
 const handleNext = (stepData) => {
    setFormData({ ...formData, ...stepData });
    setCurrentStep((prev) => prev + 1);
  };

   const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  console.log("Form data:", formData);
  const handleSubmit = () => {
  submit(JSON.stringify(formData), {
    method: "post",
    encType: "application/json",
  });
};

return (
  <div style={{ position: "relative" }}>
    {isSubmitting && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <s-card>
          <s-box padding="large">
            <s-stack gap="base" alignment="center">
              <s-spinner size="large"></s-spinner>
              <s-text variant="headingMd">
                Creating your business ruleset...
              </s-text>
            </s-stack>
          </s-box>
        </s-card>
      </div>
    )}

    <CurrentStepComponent onNext={handleNext} data={formData} />

    <div style={{ marginTop: "1rem" }}>
      {currentStep > 0 && (
        <button onClick={handleBack} disabled={isSubmitting}>
          Back
        </button>
      )}
      {currentStep === steps.length - 1 && (
        <button onClick={handleSubmit} disabled={isSubmitting}>
          Submit
        </button>
      )}
    </div>
  </div>
);


}