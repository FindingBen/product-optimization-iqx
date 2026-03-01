import { Modal } from "@shopify/polaris";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    console.log("Modal mounted");
  }, []);

  const loadingState = loading || !product || !context;

  const images = context?.media?.length ? context.media : product?.media ?? [];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  console.log('CONTEXT MEDIA', images);
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
          <div style={{ padding: 40, textAlign: "center" }}>
            <s-spinner />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Title Comparison */}
            <s-box border="base" borderRadius="medium" padding="base">
              <s-text weight="bold">Title</s-text>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <s-text style={{ textDecoration: "line-through", color: "#bf0711" }}>
                    {product?.title || "—"}
                  </s-text>
                  <s-badge tone="info">Original</s-badge>
                </div>
                <div style={{ flex: 1 }}>
                  <s-text style={{ color: "#008060", fontWeight: 500 }}>
                    {context?.title || "—"}
                  </s-text>
                  <s-badge tone="success">Enhanced</s-badge>
                </div>
              </div>
            </s-box>

            {/* Description Comparison */}
            <s-box border="base" borderRadius="medium" padding="base">
              <s-text weight="bold">Description</s-text>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: `<del style="color:#bf0711">${product?.description || "<p>No description</p>"}</del>`,
                    }}
                  />
                  <s-badge tone="info">Original</s-badge>
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: context?.description || "<p>No description</p>",
                    }}
                  />
                  <s-badge tone="success">Enhanced</s-badge>
                </div>
              </div>
            </s-box>

            {/* Image Carousel */}
            {images.length > 0 && (
              <s-box border="base" borderRadius="medium" padding="base">
                <s-text weight="bold">Product Images</s-text>
                <div style={{ textAlign: "center", margin: "12px 0" }}>
                  <s-image
                    src={images[activeImageIndex]?.url}
                    alt={images[activeImageIndex]?.altText || ""}
                    style={{ maxWidth: "200px", borderRadius: "6px" }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <s-button size="small" onClick={handlePrevImage} disabled={images.length < 2}>
                      Prev
                    </s-button>
                    <s-button size="small" onClick={handleNextImage} disabled={images.length < 2} style={{ marginLeft: 8 }}>
                      Next
                    </s-button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <s-text style={{ textDecoration: "line-through", color: "#bf0711" }}>
                      {product?.media?.[activeImageIndex]?.altText || "—"}
                    </s-text>
                    <s-badge tone="info">Original Alt</s-badge>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <s-text style={{ color: "#008060", fontWeight: 500 }}>
                      {context?.media?.[activeImageIndex]?.altText || "—"}
                    </s-text>
                    <s-badge tone="success">Enhanced Alt</s-badge>
                  </div>
                </div>
              </s-box>
            )}
          </div>
        )}
      </Modal.Section>
    </Modal>
  );
};

export default ProductReviewDrawer;