import { useState } from "react";
import { Modal,TitleBar } from "@shopify/app-bridge-react";
import { useFetcher } from "react-router";

function CreateAutomationModal({ showModal,close }) {
  const fetcher = useFetcher();
  const [fields, setFields] = useState({
    title: false,
    description: false,
    alt: false,
    seo: false
  });

  const toggle = (key) => {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCreate = () => {
  const formData = new FormData();

  formData.append("intent", "createAutomation");
  formData.append("title", fields.title);
  formData.append("description", fields.description);
  formData.append("alt", fields.alt);
  formData.append("seo", fields.seo);

  fetcher.submit(formData, { method: "post" });

  close();
};

  return (
    <Modal open={showModal} onClose={close}>
  <s-box padding="base">
    <s-stack direction="block" gap="large-200">
      <s-stack direction="block" gap="base">
        <s-heading>Create Product Automation</s-heading>
        <s-text tone="neutral">
          Select which product fields should be automatically optimized whenever a new product is created.
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
            checked={fields.title}
            onChange={() => toggle("title")}
          />

          <s-checkbox
            label="Optimize description"
            checked={fields.description}
            onChange={() => toggle("description")}
          />

          <s-checkbox
            label="Optimize image alt text"
            checked={fields.alt}
            onChange={() => toggle("alt")}
          />

          <s-checkbox
            label="Optimize SEO description"
            checked={fields.seo}
            onChange={() => toggle("seo")}
          />
        </s-stack>
      </s-box>
    </s-stack>
    
  </s-box>

  {/* Footer actions with spacing */}
  

   <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
       <s-button onClick={close}>Cancel</s-button>
    <s-button variant="primary" onClick={handleCreate}>
      Create Automation
    </s-button>
   </div>
    

</Modal>
  );
}

export default CreateAutomationModal;