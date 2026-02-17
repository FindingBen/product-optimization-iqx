import { useEffect, useState } from "react";
import { useFetcher, useNavigate, useLoaderData, redirect,useRevalidator } from "react-router";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {deleteBusinessRuleset,getBusinessRuleset} from "../models/BusinessRuleset.server";
import {scanProducts,deleteProducts} from "../models/Products.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const businessRuleset = await getBusinessRuleset(session.shop);

  const products = await prisma.product.findMany({
    where: {
      shop: session.shop,
    },
    include: {
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1, // only latest score
      },
      contexts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  // Transform into UI-friendly format
  const formattedProducts = products.map((product) => {
    const latestAnalysis = product.analyses[0];
    const latestContext = product.contexts[0];
    const score = latestAnalysis?.score ?? 0;

    const imageUrl =
      latestContext?.media?.[0]?.url ?? null;

    return {
      id: product.id,
      title: product.title,
      score,
      completeness: latestAnalysis?.completeness ?? "N/A",
      imageUrl,
      createdAt: latestAnalysis?.createdAt ?? product.id,
    };
  });

  const totalProducts = formattedProducts.length;

  const optimizedProducts = formattedProducts.filter(
    (p) => p.score >= 80
  ).length;

  const avgScore =
    totalProducts > 0
      ? (
          formattedProducts.reduce(
            (sum, p) => sum + p.score,
            0
          ) / totalProducts
        ).toFixed(1)
      : 0;

  return {
    hasBusinessRuleset: !!businessRuleset,
    businessRuleset: businessRuleset,
    products: formattedProducts,
    totalProducts,
    optimizedProducts,
    avgScore,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log('data', formData)
  if (intent === "scanProducts"){
    console.log('scanning products...')
    return await scanProducts({session, admin});
  }
  else if (intent === "deleteRuleset") {
    await deleteBusinessRuleset(session.shop);
    return redirect("/app"); // re-load dashboard
  }
  else if (intent === "deleteProducts"){
    await deleteProducts({session, admin});
    return {success:true} // re-load dashboard
  }


 
};


export default function Index() {
  const fetcher = useFetcher();
  // const shopify = useAppBridge();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const isDeleting =
  fetcher.state === "submitting" &&
  fetcher.formData?.get("intent") === "deleteProducts";
  const {
  hasBusinessRuleset,
  businessRuleset,
  products,
  totalProducts,
  optimizedProducts,
  avgScore,
} = useLoaderData();

  const navigate = useNavigate();
  const revalidator = useRevalidator();
  console.log('loader data', businessRuleset)
useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.success) {
    revalidator.revalidate();
  }
}, [fetcher.state, fetcher.data]);

console.log('modal state',isScanModalOpen)

useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.totalProducts) {
    setIsScanModalOpen(false);
  }
}, [fetcher.state, fetcher.data]);

  console.log('does',hasBusinessRuleset)
  if (!hasBusinessRuleset) {
  return (
    <s-page
      heading="Welcome 👋"
      primaryAction={{
        content: "Start setup",
        onAction: () => navigate("/app/business_wizzard"),
      }}
    >
      <s-section>
        <s-box
          padding="large"
          border="base"
          borderRadius="large"
          background="subdued"
        >
          <s-stack gap="base">
            <s-heading>Complete your setup</s-heading>
            <s-paragraph>
              To use productIQX, we need to understand your store rules.
              This only takes 2 minutes.
            </s-paragraph>

            <s-button
              variant="primary"
              onClick={() => navigate("/app/business_wizzard")}
            >
              Configure business rules
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
    </s-page>
  );
}


return (
  <s-page>
    {isScanModalOpen && (
      <Modal
    open={isScanModalOpen}
    onClose={() => setIsScanModalOpen(false)}
    title="Scan your products"
  >
        <s-stack gap="base" padding="base">
          <s-paragraph>
            This will fetch all active products in your store and evaluate
            their SEO performance based on your business rules.
          </s-paragraph>

          <s-divider />

          <s-stack direction="inline" justifyContent="end" gap="small">
            <s-button
              variant="secondary"
              onClick={() => setIsScanModalOpen(false)}
            >
              Cancel
            </s-button>

            <s-button
              variant="primary"
              loading={fetcher.state === "submitting"}
              onClick={() =>
                fetcher.submit(
                  { intent: "scanProducts" },
                  { method: "post" }
                )
              }
            >
              Yes, scan products
            </s-button>
          </s-stack>
        </s-stack>
      </Modal>
    )}
      <s-button slot="primary-action">Create puzzle</s-button>
      <s-button slot="secondary-actions">Browse templates</s-button>
      <s-button slot="secondary-actions">Import image</s-button>
    {hasBusinessRuleset && (
  <s-section>
    <s-box
      padding="base"
      border="base"
      borderRadius="base"
      background="critical-subdued"
    >
      <s-stack direction="inline" alignItems="center" justifyContent="space-between">
        <s-text tone="critical">Business rules configured</s-text>

        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="deleteRuleset" />
          <s-button tone="critical" variant="secondary" type="submit">
            Delete ruleset
          </s-button>
        </fetcher.Form>
      </s-stack>
    </s-box>
  </s-section>
  
)}
      <s-section padding="base">
        <s-grid
          gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr"
          gap="small"
        >
          <s-clickable
            href="#"
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Total Optimizations</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{optimizedProducts}</s-text>
                <s-badge tone="success" icon="arrow-up">
                  0%
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          <s-clickable
            href="#"
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Total products</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>{totalProducts}</s-text>
                <s-badge tone="warning">0%</s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          <s-clickable
            href="#"
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Total score</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>3.2%</s-text>
                <s-badge tone="critical" icon="arrow-down">
                  0.8%
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
        </s-grid>
      </s-section>


     
      {hasBusinessRuleset && businessRuleset?.productScan === false && (
        <s-section accessibilityLabel="Empty state section">
        <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
          
          <s-grid justifyItems="center" maxInlineSize="550px" gap="base">
            <s-stack alignItems="center">
              <s-heading>Import and scan your products</s-heading>
              <s-paragraph alignItems="center">
                Scan your products to get SEO and Fullfilness scores, and start optimizing your store with our AI-powered recommendations.
              </s-paragraph>
            </s-stack>
            <s-button-group>
              <s-button
                slot="primary-action" variant="primary"
                onClick={() => setIsScanModalOpen(true)}
              >
                Start
              </s-button>
            </s-button-group>
          </s-grid>
        </s-grid>
      </s-section>
      )}

      {/* === */}
      {/* Table */}
      {/* This should only be visible if the merchant has created one or more puzzles. */}
      {/* === */}
      {hasBusinessRuleset && businessRuleset?.productScan === true && (
        <s-section padding="none" accessibilityLabel="Puzzles table section">
        <s-section>
    <s-box
      padding="base"
      border="base"
      borderRadius="base"
      background="critical-subdued"
    >
      <s-stack direction="inline" alignItems="center" justifyContent="space-between">
        <s-text tone="critical">Business rules configured</s-text>

        <fetcher.Form method="post">
        <input type="hidden" name="intent" value="deleteProducts" />
        <s-button
          tone="critical"
          variant="secondary"
          type="submit"
          loading={isDeleting}
        >
          Delete products
        </s-button>
      </fetcher.Form>

      </s-stack>
    </s-box>
  </s-section>
        <s-table style={{ opacity: isDeleting ? 0.5 : 1 }}>
          <s-table-header-row>
            <s-table-header listSlot="primary">Product</s-table-header>
            <s-table-header format="numeric">Complete</s-table-header>
            <s-table-header>Seo</s-table-header>
            <s-table-header>Status</s-table-header>
          </s-table-header-row>
          <s-table-body>
  {products.length === 0 && (
    <s-table-row>
      <s-table-cell colspan="4">
        <s-text>No products analyzed yet.</s-text>
      </s-table-cell>
    </s-table-row>
  )}

  {products.map((product) => (
    <s-table-row key={product.id}>
      <s-table-cell>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-clickable
            border="base"
            borderRadius="base"
            overflow="hidden"
            inlineSize="40px"
            blockSize="40px"
          >
            <s-image
              objectFit="cover"
              alt={product.title}
              src={
                product.imageUrl ??
                "https://picsum.photos/80/80"
              }
            />
          </s-clickable>

          <s-text>{product.title}</s-text>
        </s-stack>
      </s-table-cell>

      <s-table-cell>
        {product.score}%
      </s-table-cell>

      <s-table-cell>
        {product.completeness}
      </s-table-cell>

      <s-table-cell>
        <s-badge
          tone={
            product.score >= 80
              ? "success"
              : product.score >= 50
              ? "warning"
              : "critical"
          }
        >
          {product.score >= 80
            ? "Optimized"
            : product.score >= 50
            ? "Needs Work"
            : "Poor"}
        </s-badge>
      </s-table-cell>
    </s-table-row>
  ))}
</s-table-body>

      </s-table>
    </s-section>
      )}


</s-page>
)
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
