import { useEffect, useState,useCallback  } from "react";
import { useFetcher, useNavigate, useLoaderData, redirect,useRevalidator } from "react-router";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import OptimizeProductModal from "../components/modals/optimizationModal"
import ProductUpdateModal from "../components/modals/productUpdateModal"
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOrCreateSubscription } from "../models/Subscription.server";
import { authenticate } from "../shopify.server";
import ProductReviewDrawer from "../components/ProductReviewDrawer";
import {getBusinessRuleset,createBusinessRuleset} from "../models/BusinessRuleset.server";
import {scanProducts,deleteProducts,handleUpdateProductShopify} from "../models/Products.server";
import {enqueueOptimization} from "../models/Automation.server"
import {fetchOptimizationJobs,handleReject,handleApprove} from "../models/Optimization.server"
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const businessRuleset = await getBusinessRuleset(session.shop);
  const optimizationJobs = await fetchOptimizationJobs({shop:session.shop})
  const subscription = await getOrCreateSubscription(session.shop)
  const limit = subscription.plan.monthlyOptimizationLimit;
  const used = subscription.optimizationsUsedThisCycle;
  const canOptimize = limit === -1 || used < limit;
  // Pagination: read page from query params, default 1
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = 20;
  const skip = (page - 1) * perPage;

  const totalProducts = await prisma.product.count({ where: { shop: session.shop } });

  const products = await prisma.product.findMany({
    where: { shop: session.shop },
    include: {
      optimizations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      media: true,
    },
    skip,
    take: perPage,
  });
  // Transform into UI-friendly format
  const formattedProducts = products.map((product) => {
    const latestAnalysis = product?.analyses[0] ?? null;
    const image = product.media?.[0] ?? null;
    const score = latestAnalysis?.score ?? 0;
    const latestOptimization = product?.optimizations[0] ?? null;

    const imageUrl = product.media?.[0]?.url ?? null;

    return {
      id: product.id,
      title: product.title,
      shopifyProductId: product.shopifyProductId,
      score,
      optimizationStatus: latestOptimization?.status ?? "idle",
      completeness: latestAnalysis?.completeness ?? "N/A",
      imageUrl,
      createdAt: latestAnalysis?.createdAt ?? product.id,
    };
  });

  const displayedCount = formattedProducts.length;

  const optimizedProducts = 0

  const avgScore =
    displayedCount > 0
      ? (
          formattedProducts.reduce(
            (sum, p) => sum + p.score,
            0
          ) / displayedCount
        ).toFixed(1)
      : 0;

  const totalPages = Math.max(1, Math.ceil(totalProducts / perPage));

  return {
    hasBusinessRuleset: !!businessRuleset,
    businessRuleset: businessRuleset,
    products: formattedProducts,
    optimizationJobs,
    totalProducts,
    page,
    perPage,
    totalPages,
    optimizedProducts,
      canOptimize,
      optimizationsUsed: used,
    optimizationsLimit: limit,
    planName: subscription,
    avgScore,
  };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "scanProducts"){

    return await scanProducts({session, admin});
  }
   if (intent === "rulesetConfigure"){
    const shop = session.shop

    return await createBusinessRuleset({shop, admin});
  }
  else if (intent === "deleteProducts"){
    await deleteProducts({session, admin});
    return {success:true}
  }
  else if (intent === "startOptimization") {

  const productId = formData.get("productId");
    
  await enqueueOptimization(session.shop, productId)

  return { queued: true };
}
else if (intent === "handleUpdateProduct"){
  const productId = formData.get("productId");
  await handleUpdateProductShopify(admin, session, productId);
  return { success: true };
}
else if (intent === "loadReview") {
  const productId = formData.get("productId");

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { product: null, context: null };
  }

  const context = await prisma.productContext.findUnique({
    where: {
      shop_shopifyProductId: {
        shop: session.shop,
        shopifyProductId: product.shopifyProductId,
      },
    },
    include: {
      media: true,
    },
  });

  return { product, context };
}
else if (intent === "handleReject"){
  const productId = formData.get("productId");
  await handleReject({session,productId})
  return {success:true}
}
else if (intent === "handleApprove"){
  
  const productId = formData.get("productId");
  await handleApprove({session,productId,admin})
  return {success:true}
}
};


export default function Index() {
  const fetcher = useFetcher();
  const reviewFetcher = useFetcher();
  const actionFetcher = useFetcher();
  // const shopify = useAppBridge();

  const [optimizingId, setOptimizingId] = useState(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);

  const isDeleting =
  fetcher.state === "submitting" &&
  fetcher.formData?.get("intent") === "deleteProducts";
  const {
  hasBusinessRuleset,
  businessRuleset,
  products,
  totalProducts,
  optimizationJobs,
  optimizedProducts,
  avgScore,
  canOptimize,       
  optimizationsUsed,   
  optimizationsLimit,  
  planName,
  page,
  totalPages,
} = useLoaderData();

  const navigate = useNavigate();
  const revalidator = useRevalidator();

useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.success) {
    revalidator.revalidate();
  }
}, [fetcher.state, fetcher.data]);


useEffect(() => {
  if (fetcher.state === "idle" && optimizingId) {
    setOptimizingId(null);
  }
}, [fetcher.state]);

  console.log('LIMIT',planName)
  console.log('CANAN',canOptimize)
const hasRunningJob = products.some(
  (p) => p.optimizationStatus === "processing" ||
         p.optimizationStatus === "queued"
);

useEffect(() => {
  if (!hasRunningJob) return;

  const interval = setInterval(() => {
    revalidator.revalidate();
  }, 4000);

  return () => clearInterval(interval);
}, [hasRunningJob]);

const handleApprove = () =>{
  setShowReviewDrawer(false);
  actionFetcher.submit(
    {intent: "handleApprove",
productId: selectedProductId},
{method:"post"}
) 
}

const handleReject = () =>{
  setShowReviewDrawer(false);
  actionFetcher.submit(
    {intent: "handleReject",
productId: selectedProductId},
{method:"post"}
) 
  

}

useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.totalProducts) {
    setIsScanModalOpen(false);
  }
}, [fetcher.state, fetcher.data]);



const handleOptimizeSubmit = (productId) => {
  setOptimizingId(productId);      // mark row loading
  setShowModal(false);             // close modal immediately

  fetcher.submit(
    {
      intent: "startOptimization",
      productId,
    },
    { method: "post" }
  );
};

const handleUpdateProduct = (productId) =>{
  fetcher.submit(
    {intent: "handleUpdateProduct",
    productId},
    {method:"post"}
  )
}
console.log('PPPPPP',selectedProductId)
const handleCloseDrawer = useCallback(() => {
  setShowReviewDrawer(false);
  setSelectedProductId(null);

},[])

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
              To use productIQX, we need to understand your store.
              This only takes a second.
            </s-paragraph>

            <s-button
              variant="primary"
              onClick={() => setRulesModalOpen(true)}
            >
              Configure business rules
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
      {rulesModalOpen && (
        <Modal
          open={rulesModalOpen}
          onClose={() => setRulesModalOpen(false)}
          title="Business rules"
        >
          <s-stack gap="base" padding="base">
            <s-paragraph>
              This will configure your business rules based on the latest analysis. It may take a minute to complete.
            </s-paragraph>

            <s-divider />

            <s-stack direction="inline" justifyContent="end" gap="small">
              <s-button
                variant="secondary"
                onClick={() => setRulesModalOpen(false)}
              >
                Cancel
              </s-button>

              <s-button
                variant="primary"
                loading={fetcher.state === "submitting"}
                onClick={() =>
                  fetcher.submit(
                    { intent: "rulesetConfigure" },
                    { method: "post" }
                  )
                }
              >
                Continue
              </s-button>
            </s-stack>
          </s-stack>
        </Modal>
      )}
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
                <s-text>{optimizationJobs}</s-text>
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
          {!canOptimize && (
      <s-section>
        <s-box padding="base" border="base" borderRadius="base" background="critical-subdued">
          <s-stack direction="inline" alignItems="center" justifyContent="space-between">
            <s-stack direction="block" gap="small">
              <s-text tone="critical">
                You have used all {optimizationsLimit} optimizations for this billing cycle.
              </s-text>
              <s-text tone="subdued">
                Upgrade your plan to continue optimizing products.
              </s-text>
            </s-stack>
            <s-button variant="primary" onClick={() => navigate("/app/plans")}>
              Upgrade Plan
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
    )}
    {canOptimize && optimizationsLimit !== -1 && optimizationsUsed >= optimizationsLimit * 0.8 && (
      <s-section>
        <s-box padding="base" border="base" borderRadius="base" background="warning-subdued">
          <s-stack direction="inline" alignItems="center" justifyContent="space-between">
            <s-text tone="warning">
              {optimizationsUsed} of {optimizationsLimit} optimizations used this cycle.
            </s-text>
            <s-button variant="secondary" onClick={() => navigate("/app/plans")}>
              View Plans
            </s-button>
          </s-stack>
        </s-box>
      </s-section>
    )}
    
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

  <s-table-cell align="end">
  {product.optimizationStatus === "processing" ? (
    <s-button disabled>
      <s-spinner size="small" /> In Progress
    </s-button>
  ) : product.optimizationStatus === "queued" ? (
    <s-button disabled>
      Queued
    </s-button>
  ) : product.optimizationStatus === "completed" ? (
    <s-button
      variant="primary"
      onClick={() => {
        setSelectedProductId(product.shopifyProductId);
        setShowReviewDrawer(true);
        reviewFetcher.submit(
          { intent: "loadReview", productId: product.id },
          { method: "post" }
        );
      }}
    >
      View
    </s-button>
  ) : product.optimizationStatus === "failed" ? (
    <s-button
      tone="critical"
      disabled={!canOptimize}  // ← disable retry if out of quota
      onClick={() => {
        setSelectedProductId(product.id);
        setShowModal(true);
      }}
    >
      Retry
    </s-button>
  ) : (
    <s-button
      variant="primary"
      disabled={!canOptimize}  // ← disable optimize if out of quota
      onClick={() => {
        if (!canOptimize) return;
        setSelectedProductId(product.id);
        setShowModal(true);
      }}
    >
      {canOptimize ? "Optimize" : "Limit Reached"}
    </s-button>
  )}
</s-table-cell>
</s-table-row>
  ))}
</s-table-body>
<ProductUpdateModal showModal={showProductModal} onClose={() => setShowProductModal(false)} awaitUpdate={handleUpdateProduct} productId={selectedProductId}/>
      <OptimizeProductModal
  showModal={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={() => handleOptimizeSubmit(selectedProductId)}
/>
<ProductReviewDrawer
  open={showReviewDrawer}
  onClose={handleCloseDrawer}
  product={reviewFetcher.data?.product}
  context={reviewFetcher.data?.context}
  loading={
    reviewFetcher.state === "submitting" ||
    reviewFetcher.state === "loading" ||
    !reviewFetcher.data // treat no data as loading
  }
  onApprove={handleApprove}
  onReject={handleReject}
/>
      </s-table>
            {totalPages > 1 && (
              <s-section padding="base">
                <s-stack direction="inline" justifyContent="center" gap="small">
                  <s-button
                    disabled={page <= 1}
                    onClick={() => navigate(`?page=${page - 1}`)}
                  >
                    Previous
                  </s-button>

                  <s-text>
                    Page {page} of {totalPages}
                  </s-text>

                  <s-button
                    disabled={page >= totalPages}
                    onClick={() => navigate(`?page=${page + 1}`)}
                  >
                    Next
                  </s-button>
                </s-stack>
              </s-section>
            )}
      <Modal
    open={rulesModalOpen}
    onClose={() => setRulesModalOpen(false)}
    title="Business rules"
  >
        <s-stack gap="base" padding="base">
          <s-paragraph>
            This will configure your business rules based on the latest analysis. It may take a minute to complete.
          </s-paragraph>

          <s-divider />

          <s-stack direction="inline" justifyContent="end" gap="small">
            <s-button
              variant="secondary"
              onClick={() => setRulesModalOpen(false)}
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
    </s-section>
      )}


</s-page>
)
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
