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

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };
  console.log("BusinessRulesetComponent rendered with data:", form);
  const handleSave = async () => {
    await onSave(form);
    setIsDirty(false);
    setEditingField(null);
  };

  const handleCancel = () => {
    setForm(businessData);
    setIsDirty(false);
    setEditingField(null);
  };

  const EditableField = ({ label, field, value, type = "text" }) => (
    <s-stack gap="x-small">
      <s-text variant="bodySm" tone="subdued">
        {label}
      </s-text>

      {editingField === field ? (
        <s-text-field
          value={value || ""}
          name={field}
          type={type}
          onChange={(e) => updateField(field, e.target.value)}
          onBlur={() => setEditingField(null)}
          autoFocus
        />
      ) : (
        <s-box
          padding="small"
          background="surface"
          border="base"
          borderRadius="medium"
          style={{ cursor: "pointer" }}
          onClick={() => setEditingField(field)}
        >
          {value ? (
            <s-text variant="bodyMd">{value}</s-text>
          ) : (
            <s-badge tone="attention">Not configured</s-badge>
          )}
        </s-box>
      )}
    </s-stack>
  );

  return (
    <s-stack gap="large">

      {/* Sticky Save Bar */}
      {isDirty && (
        <s-box
          padding="medium"
          background="surface"
          border="base"
          borderRadius="medium"
        >
          <s-stack direction="inline" justifyContent="space-between">
            <s-text variant="bodyMd">
              Unsaved changes
            </s-text>
            <s-stack direction="inline" gap="small">
              <s-button variant="secondary" onClick={handleCancel}>
                Cancel
              </s-button>
              <s-button variant="primary" onClick={handleSave}>
                Save
              </s-button>
            </s-stack>
          </s-stack>
        </s-box>
      )}

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
                label="Mix Title Length"
                value={form.minTitleLength || ""}
                onInput={(e) =>
                  setForm({ ...form, productNameRule: e.target.value })
                }
              />
              <s-text-field
                label="Max Title Length"
                field="maxTitleLength"
                name="maxTitleLength"
                value={form.maxTitleLength}
                type="number"
                onInput={(e) =>
                  setForm({ ...form, maxTitleLength: e.target.value })
                }
              />
              <s-text-field
                label="Min Description Length"
                field="minDescriptionLength"
                value={form.minDescriptionLength}
                name="minDescriptionLength"
                type="number"
                onInput={(e) =>
                  setForm({ ...form, minDescriptionLength: e.target.value })
                }
              />
              <s-text-field
                label="Max Description Length"
                field="maxDescriptionLength"
                name="maxDescriptionLength"
                value={form.maxDescriptionLength}
                type="number"
                onInput={(e) =>
                  setForm({ ...form, maxDescriptionLength: e.target.value })
                }
              />
              <s-text-field
                label="Minimum Images"
                field="minImages"
                value={form.minImages}
                type="number"
                name="minImages"
                onInput={(e) =>
                  setForm({ ...form, minImages: e.target.value })
                }
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