import { Modal } from "@shopify/polaris";
import { useEffect, useState } from "react";

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6d7175",
    marginBottom: 10,
  }}>
    {children}
  </div>
);

const Badge = ({ tone, children }) => {
  const styles = {
    info:    { bg: "rgba(0,96,184,0.1)",  color: "#0060b8", border: "rgba(0,96,184,0.25)" },
    success: { bg: "rgba(0,122,94,0.1)", color: "#007a5e", border: "rgba(0,122,94,0.25)" },
  };
  const s = styles[tone] ?? styles.info;
  return (
    <span style={{
      display: "inline-block",
      marginTop: 6,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      padding: "2px 8px",
      borderRadius: 20,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {children}
    </span>
  );
};

const CompareBlock = ({ label, original, enhanced, isHtml = false }) => (
  <div style={{
    borderRadius: 10,
    border: "1px solid #e1e3e5",
    overflow: "hidden",
    marginBottom: 16,
  }}>
    {/* Section header */}
    <div style={{
      padding: "10px 16px",
      background: "#f6f6f7",
      borderBottom: "1px solid #e1e3e5",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#1a1a1a",
        letterSpacing: "0.01em",
      }}>
        {label}
      </span>
    </div>

    {/* Two-column comparison */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Original */}
      <div style={{
        padding: "14px 16px",
        borderRight: "1px solid #e1e3e5",
        background: "rgba(215,44,13,0.03)",
      }}>
        <SectionLabel>Original</SectionLabel>
        {isHtml ? (
          <div
            style={{ fontSize: 13, color: "#3d4246", lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: original || "<p style='color:#8c9196'>No content</p>" }}
          />
        ) : (
          <p style={{ fontSize: 13, color: "#3d4246", lineHeight: 1.6, margin: 0 }}>
            {original || <span style={{ color: "#8c9196" }}>—</span>}
          </p>
        )}
        <Badge tone="info">Original</Badge>
      </div>

      {/* Enhanced */}
      <div style={{
        padding: "14px 16px",
        background: "rgba(0,122,94,0.03)",
      }}>
        <SectionLabel>Enhanced</SectionLabel>
        {isHtml ? (
          <div
            style={{ fontSize: 13, color: "#007a5e", lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: enhanced || "<p style='color:#8c9196'>No content</p>" }}
          />
        ) : (
          <p style={{ fontSize: 13, color: "#007a5e", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            {enhanced || <span style={{ color: "#8c9196" }}>—</span>}
          </p>
        )}
        <Badge tone="success">Enhanced</Badge>
      </div>
    </div>
  </div>
);

const ImageWithFallback = ({ src, alt, style }) => {
  const [errored, setErrored] = useState(false);
  const isPlaceholder = !src || src.includes("placehold.it") || src.includes("placeholder");

  if (isPlaceholder || errored) {
    return (
      <div style={{
        width: style?.maxWidth ?? 200,
        height: 200,
        borderRadius: 8,
        background: "#f1f2f3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        margin: "0 auto",
        border: "1px dashed #c4cdd5",
      }}>
        <span style={{ fontSize: 28 }}>🖼️</span>
        <span style={{ fontSize: 11, color: "#8c9196" }}>No image available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      style={{
        maxWidth: style?.maxWidth ?? 200,
        borderRadius: 8,
        display: "block",
        margin: "0 auto",
        objectFit: "cover",
        ...style,
      }}
    />
  );
};

const ProductReviewDrawer = ({
  open,
  onClose,
  product,
  context,
  loading,
  onApprove,
  onReject,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const loadingState = loading || !product || !context;

  
  const contextImages = context?.media ?? [];
  const productImages = product?.media ?? [];
  const displayImages = contextImages.length > 0 ? contextImages : productImages;

  const handleNextImage = () => setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
  const handlePrevImage = () => setActiveImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

  // Find matching original image by shopifyMediaId
  const currentContextImage = contextImages[activeImageIndex];
  const currentOriginalImage = productImages.find(
    (img) => img.shopifyMediaId === currentContextImage?.shopifyMediaId
  ) ?? productImages[activeImageIndex];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review Optimized Product"
      primaryAction={{
        content: "Approve & Publish",
        onAction: onApprove,
        loading: loading,
        disabled: loading,
      }}
      secondaryActions={[
        { content: "Close", onAction: onClose },
        ...(onReject ? [{ content: "Reject", destructive: true, onAction: onReject, disabled: loading }] : []),
      ]}
      large
    >
      <Modal.Section>
        {loadingState ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <s-spinner />
            <p style={{ marginTop: 12, fontSize: 13, color: "#8c9196" }}>Loading optimization...</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Title */}
            <CompareBlock
              label="Product Title"
              original={product?.title}
              enhanced={context?.title}
            />

            {/* Description */}
            <CompareBlock
              label="Description"
              original={product?.description}
              enhanced={context?.description}
              isHtml
            />

            {/* SEO Description */}
            {(product?.seoDescription || context?.seoDescription) && (
              <CompareBlock
                label="SEO Meta Description"
                original={product?.seoDescription}
                enhanced={context?.seoDescription}
              />
            )}

            {/* Images + Alt Text */}
            {displayImages.length > 0 && (
              <div style={{
                borderRadius: 10,
                border: "1px solid #e1e3e5",
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  padding: "10px 16px",
                  background: "#f6f6f7",
                  borderBottom: "1px solid #e1e3e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                    Product Images
                  </span>
                  {displayImages.length > 1 && (
                    <span style={{ fontSize: 12, color: "#8c9196" }}>
                      {activeImageIndex + 1} / {displayImages.length}
                    </span>
                  )}
                </div>

                {/* Image display */}
                <div style={{ padding: "20px 16px", background: "#fafbfb", textAlign: "center" }}>
                  <ImageWithFallback
                    src={currentContextImage?.url ?? currentOriginalImage?.url}
                    alt={currentContextImage?.altText ?? ""}
                    style={{ maxWidth: 220 }}
                  />

                  {/* Prev / Next */}
                  {displayImages.length > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={handlePrevImage}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          border: "1px solid #e1e3e5",
                          background: "white",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={handleNextImage}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          border: "1px solid #e1e3e5",
                          background: "white",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>

                {/* Alt text comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #e1e3e5" }}>
                  <div style={{
                    padding: "14px 16px",
                    borderRight: "1px solid #e1e3e5",
                    background: "rgba(215,44,13,0.03)",
                  }}>
                    <SectionLabel>Original Alt Text</SectionLabel>
                    <p style={{ fontSize: 13, color: "#3d4246", lineHeight: 1.6, margin: 0 }}>
                      {currentOriginalImage?.altText || <span style={{ color: "#8c9196" }}>No alt text</span>}
                    </p>
                    <Badge tone="info">Original</Badge>
                  </div>
                  <div style={{
                    padding: "14px 16px",
                    background: "rgba(0,122,94,0.03)",
                  }}>
                    <SectionLabel>Enhanced Alt Text</SectionLabel>
                    <p style={{ fontSize: 13, color: "#007a5e", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                      {currentContextImage?.altText || <span style={{ color: "#8c9196" }}>No alt text</span>}
                    </p>
                    <Badge tone="success">Enhanced</Badge>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal.Section>
    </Modal>
  );
};

export default ProductReviewDrawer;