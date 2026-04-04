import { useState } from "react";
import { useFetcher } from "react-router";
import { Modal } from "@shopify/app-bridge-react";

function EditAutomationModal({ automation, close }) {
    const fetcher = useFetcher();
  const [fields, setFields] = useState({
    optimizeTitle: automation.optimizeTitle,
    optimizeDescription: automation.optimizeDescription,
    optimizeAltText: automation.optimizeAltText,
    optimizeSeo: automation.optimizeSeo,
  });

  const toggle = (key) => setFields((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    fetcher.submit(
      {
        intent: "updateAutomation",
        automationId: automation.id,
        optimizeTitle: String(fields.optimizeTitle),
        optimizeDescription: String(fields.optimizeDescription),
        optimizeAltText: String(fields.optimizeAltText),
        optimizeSeo: String(fields.optimizeSeo),
      },
      { method: "post" }
    );
    close();
  };

  return (
    <Modal open onClose={close}>
      <s-box padding="base">
        <s-stack direction="block" gap="large-200">

          <s-stack direction="block" gap="base">
            <s-heading>Edit Automation</s-heading>
            <s-text tone="neutral">
              Select which product fields should be optimized by this automation rule.
            </s-text>
          </s-stack>

          <s-box
            background="base"
            borderRadius="small"
            border="small-100 subdued solid"
            padding="base"
          >
            <s-stack direction="block" gap="base">
              <s-checkbox
                label="Optimize product title"
                checked={fields.optimizeTitle}
                onChange={() => toggle("optimizeTitle")}
              />
              <s-checkbox
                label="Optimize description"
                checked={fields.optimizeDescription}
                onChange={() => toggle("optimizeDescription")}
              />
              <s-checkbox
                label="Optimize image alt text"
                checked={fields.optimizeAltText}
                onChange={() => toggle("optimizeAltText")}
              />
              {/* <s-checkbox
                label="Optimize SEO description"
                checked={fields.optimizeSeo}
                onChange={() => toggle("optimizeSeo")}
              /> */}
            </s-stack>
          </s-box>

        </s-stack>
      </s-box>

      <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <s-button onClick={close}>Cancel</s-button>
        <s-button variant="primary" onClick={handleSave}>
          Save Changes
        </s-button>
      </div>
    </Modal>
  );
}


export default EditAutomationModal;