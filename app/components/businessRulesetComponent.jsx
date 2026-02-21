import React from "react";

const BusinessRulesetComponent = ({ businessData }) => {
  if (!businessData) return null;

  const {
    productNameRule,
    productDescriptionRule,
    productImageRule,
    productAltImageRule,
    keywords,
    minTitleLength,
    maxTitleLength,
    minDescriptionLength,
    maxDescriptionLength,
    minImages,
    requiresAltText,
  } = businessData;

  const RuleBlock = ({ label, value }) => (
    <s-stack gap="x-small">
      <s-text variant="bodySm" tone="subdued">
        {label}
      </s-text>

      {value ? (
        <s-box
          padding="small"
          background="surface"
          border="base"
          borderRadius="medium"
        >
          <s-text variant="bodyMd">{value}</s-text>
        </s-box>
      ) : (
        <s-badge tone="attention">Not configured</s-badge>
      )}
    </s-stack>
  );

  return (
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

        {/* Length Rules */}
        <s-box>
          <s-heading size="small">Length Requirements</s-heading>
          <s-stack gap="small">
            <s-text>
              Title length:{" "}
              <b>
                {minTitleLength} – {maxTitleLength} characters
              </b>
            </s-text>
            <s-text>
              Description length:{" "}
              <b>
                {minDescriptionLength} – {maxDescriptionLength} characters
              </b>
            </s-text>
            <s-text>
              Minimum images: <b>{minImages}</b>
            </s-text>
            <s-text>
              Requires alt text:{" "}
              {requiresAltText ? (
                <s-badge tone="success">Yes</s-badge>
              ) : (
                <s-badge tone="attention">No</s-badge>
              )}
            </s-text>
          </s-stack>
        </s-box>

        {/* Content Rules */}
        <s-box>
          <s-heading size="small">Content Rules</s-heading>
          <s-stack gap="large">
            <RuleBlock label="Product Title Rule" value={productNameRule} />
            <RuleBlock
              label="Product Description Rule"
              value={productDescriptionRule}
            />
            <RuleBlock label="Product Image Rule" value={productImageRule} />
            <RuleBlock label="Alt Text Rule" value={productAltImageRule} />
            <RuleBlock label="SEO Keywords" value={keywords} />
          </s-stack>
        </s-box>
      </s-stack>
    </s-box>
  );
};

export default BusinessRulesetComponent;