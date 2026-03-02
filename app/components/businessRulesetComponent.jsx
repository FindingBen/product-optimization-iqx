import React, { useState, useEffect } from "react";

const BusinessRulesetComponent = ({ businessData, onSave }) => {
  const [form, setForm] = useState(businessData);
  const [editingField, setEditingField] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setForm(businessData);
    setIsDirty(false);
  }, [businessData]);

  if (!businessData) return null;

  console.log("BusinessRulesetComponent rendered with data:", form);


  return (
    <s-stack gap="large">

      {/* Sticky Save Bar */}
     

      {/* Main Card */}
      <s-box
        padding="large"
        border="base"
        borderRadius="large"
        background="subdued"
      >
        <s-stack gap="large">

          {/* Header */}
          <s-stack direction="inline" justifyContent="space-between">
            <s-heading size="medium">Business Ruleset</s-heading>
            <s-badge tone="success">Configured</s-badge>
          </s-stack>

          {/* Length Requirements */}
          <s-box>
            <s-heading size="small">Length Requirements</s-heading>
            <s-stack gap="small">
              <s-text-field
                name="productNameRule"
                label="Max Title Length"
                value={form.minTitleLength || ""}
                disabled={true}
              />
              <s-text-field
                label="Max Title Length"
                field="maxTitleLength"
                name="maxTitleLength"
                disabled={true}
                value={form.maxTitleLength}
                type="number"
              
              />
              <s-text-field
                label="Min Description Length"
                field="minDescriptionLength"
                value={form.minDescriptionLength}
                name="minDescriptionLength"
                type="number"
                disabled={true}
              />
              <s-text-field
                label="Max Description Length"
                field="maxDescriptionLength"
                name="maxDescriptionLength"
                value={form.maxDescriptionLength}
                type="number"
                disabled={true}
              />
              <s-text-field
                label="Minimum Images"
                field="minImages"
                value={form.minImages}
                type="number"
                name="minImages"
                disabled={true}
              />
            </s-stack>
          </s-box>

          {/* Content Rules */}
          <s-box>
            <s-heading size="small">Content Rules</s-heading>
            <s-stack gap="large">
              <s-text-field
                label="Product Title Rule"
                field="productNameRule"
                name="productNameRule"
                value={form.productNameRule}
                onInput={(e) =>
                  setForm({ ...form, productNameRule: e.target.value })
                }
              />
              <s-text-field
                label="Product Description Rule"
                field="productDescriptionRule"
                value={form.productDescriptionRule}
                name="productDescriptionRule"
                onInput={(e) =>
                  setForm({ ...form, productDescriptionRule: e.target.value })
                }
              />
              <s-text-field
                label="Product Image Rule"
                field="productImageRule"
                value={form.productImageRule}
                name="productImageRule"
                onInput={(e) =>
                  setForm({ ...form, productImageRule: e.target.value })
                }
              />
              <s-text-field
                label="Alt Text Rule"
                field="productAltImageRule"
                value={form.productAltImageRule}
                name="productAltImageRule"
                onInput={(e) =>
                  setForm({ ...form, productAltImageRule: e.target.value })
                }
              />
              <s-text-field
                label="SEO Keywords"
                field="keywords"
                value={form.keywords}
                name="keywords"
                onInput={(e) =>
                  setForm({ ...form, keywords: e.target.value })
                }
              />
            </s-stack>
          </s-box>

        </s-stack>
      </s-box>
    </s-stack>
  );
};

export default BusinessRulesetComponent;