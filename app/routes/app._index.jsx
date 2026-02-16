import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useLoaderData , redirect} from "react-router";
import {deleteBusinessRuleset} from "../models/BusinessRuleset.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const ruleset = await prisma.businessRuleset.findUnique({
    where: {
      shop: session.shop,
    },
    select: {
      id: true,
    },
  });

  return {
    hasBusinessRuleset: !!ruleset,
  };
};


export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // 🔥 DELETE RULESET
  if (intent === "deleteRuleset") {
    await deleteBusinessRuleset(session.shop);
    return redirect("/app"); // re-load dashboard
  }

  // --- EXISTING PRODUCT LOGIC BELOW ---
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];

  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product { id title }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );

  const responseJson = await response.json();

  return {
    product: responseJson.data.productCreate.product,
  };
};


export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [optimizedProducts, setOptimizedProducts] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const { hasBusinessRuleset } = useLoaderData();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState({
  banner: true,
  setupGuide: true,
  calloutCard: true,
  featuredApps: true,
});




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

      {/* === */}
      {/* Puzzle templates */}
      {/* === */}
      <s-page heading="Puzzles">
      <s-button slot="primary-action" variant="primary">
        Create puzzle
      </s-button>
      <s-button slot="secondary-actions" variant="secondary">
        Export puzzles
      </s-button>
      <s-button slot="secondary-actions" variant="secondary">
        Import puzzles
      </s-button>
      {/* === */}
      {/* Empty state */}
      {/* This should only be visible if the merchant has not created any puzzles yet. */}
      {/* === */}
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
              <s-button slot="primary-action" accessibilityLabel="Add a new puzzle">
                {" "}
                Start{" "}
              </s-button>
            </s-button-group>
          </s-grid>
        </s-grid>
      </s-section>

      {/* === */}
      {/* Table */}
      {/* This should only be visible if the merchant has created one or more puzzles. */}
      {/* === */}
      <s-section padding="none" accessibilityLabel="Puzzles table section">
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Puzzle</s-table-header>
            <s-table-header format="numeric">Pieces</s-table-header>
            <s-table-header>Created</s-table-header>
            <s-table-header>Status</s-table-header>
          </s-table-header-row>
          <s-table-body>
            <s-table-row>
              <s-table-cell>
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-clickable
                    href="/app/details"
                    accessibilityLabel="Mountain View puzzle thumbnail"
                    border="base"
                    borderRadius="base"
                    overflow="hidden"
                    inlineSize="40px"
                    blockSize="40px"
                  >
                    <s-image
                      objectFit="cover"
                      alt="Mountain View puzzle thumbnail"
                      src="https://picsum.photos/id/29/80/80"
                     />
                  </s-clickable>
                  <s-link href="/app/details">Mountain View</s-link>
                </s-stack>
              </s-table-cell>
              <s-table-cell>16</s-table-cell>
              <s-table-cell>Today</s-table-cell>
              <s-table-cell>
                <s-badge color="base" tone="success">
                  Active
                </s-badge>
              </s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-clickable
                    href="/app/details"
                    accessibilityLabel="Ocean Sunset puzzle thumbnail"
                    border="base"
                    borderRadius="base"
                    overflow="hidden"
                    inlineSize="40px"
                    blockSize="40px"
                  >
                    <s-image
                      objectFit="cover"
                      alt="Ocean Sunset puzzle thumbnail"
                      src="https://picsum.photos/id/12/80/80"
                     />
                  </s-clickable>
                  <s-link href="/app/details">Ocean Sunset</s-link>
                </s-stack>
              </s-table-cell>
              <s-table-cell>9</s-table-cell>
              <s-table-cell>Yesterday</s-table-cell>
              <s-table-cell>
                <s-badge color="base" tone="success">
                  Active
                </s-badge>
              </s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-clickable
                    href="/app/details"
                    accessibilityLabel="Forest Animals puzzle thumbnail"
                    border="base"
                    borderRadius="base"
                    overflow="hidden"
                    inlineSize="40px"
                    blockSize="40px"
                  >
                    <s-image
                      objectFit="cover"
                      alt="Forest Animals puzzle thumbnail"
                      src="https://picsum.photos/id/324/80/80"
                     />
                  </s-clickable>
                  <s-link href="/app/details">Forest Animals</s-link>
                </s-stack>
              </s-table-cell>
              <s-table-cell>25</s-table-cell>
              <s-table-cell>Last week</s-table-cell>
              <s-table-cell>
                <s-badge color="base" tone="neutral">
                  Draft
                </s-badge>
              </s-table-cell>
            </s-table-row>
            {/* Add more rows as needed here */}
            {/* If more than 100 rows are needed, index page tables should use the paginate, hasPreviousPage, hasNextPage, onPreviousPage, and onNextPage attributes to display and handle pagination) */}
          </s-table-body>
      </s-table>
    </s-section>
</s-page>

      {/* === */}
      {/* News */}
      {/* === */}
      <s-section>
        <s-heading>News</s-heading>
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))"
          gap="base"
        >
          {/* News item 1 */}
          <s-grid
            background="base"
            border="base"
            borderRadius="base"
            padding="base"
            gap="small-400"
          >
            <s-text>Jan 21, 2025</s-text>
            <s-link href="/news/new-shapes-and-themes">
              <s-heading>New puzzle shapes and themes added</s-heading>
            </s-link>
            <s-paragraph>
              We've added 5 new puzzle piece shapes and 3 seasonal themes to
              help you create more engaging and unique puzzles for your
              customers.
            </s-paragraph>
          </s-grid>
          {/* News item 2 */}
          <s-grid
            background="base"
            border="base"
            borderRadius="base"
            padding="base"
            gap="small-400"
          >
            <s-text>Nov 6, 2024</s-text>
            <s-link href="/news/puzzle-difficulty-customization">
              <s-heading>Puzzle difficulty customization features</s-heading>
            </s-link>
            <s-paragraph>
              Now you can fine-tune the difficulty of your puzzles with new
              rotation controls, edge highlighting options, and piece
              recognition settings.
            </s-paragraph>
          </s-grid>
        </s-grid>
        <s-stack
          direction="inline"
          alignItems="center"
          justifyContent="center"
          paddingBlockStart="base"
        >
          <s-link href="/news">See all news items</s-link>
        </s-stack>
      </s-section>

      {/* === */}
      {/* Featured apps */}
      {/* If dismissed, use local storage or a database entry to avoid showing this section again to the same user. */}
      {/* === */}
      {visible.featuredApps && (
        <s-section>
          <s-grid
            gridTemplateColumns="1fr auto"
            alignItems="center"
            paddingBlockEnd="small-400"
          >
            <s-heading>Featured apps</s-heading>
            <s-button
              onClick={() => setVisible({ ...visible, featuredApps: false })}
              icon="x"
              tone="neutral"
              variant="tertiary"
              accessibilityLabel="Dismiss featured apps section"
            ></s-button>
          </s-grid>
          <s-grid
            gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))"
            gap="base"
          >
            {/* Featured app 1 */}
            <s-clickable
              href="https://apps.shopify.com/flow"
              border="base"
              borderRadius="base"
              padding="base"
              inlineSize="100%"
              accessibilityLabel="Download Shopify Flow"
            >
              <s-grid
                gridTemplateColumns="auto 1fr auto"
                alignItems="stretch"
                gap="base"
              >
                <s-thumbnail
                  size="small"
                  src="https://cdn.shopify.com/app-store/listing_images/15100ebca4d221b650a7671125cd1444/icon/CO25r7-jh4ADEAE=.png"
                  alt="Shopify Flow icon"
                 />
                <s-box>
                  <s-heading>Shopify Flow</s-heading>
                  <s-paragraph>Free</s-paragraph>
                  <s-paragraph>
                    Automate everything and get back to business.
                  </s-paragraph>
                </s-box>
                <s-stack justifyContent="start">
                  <s-button
                    href="https://apps.shopify.com/flow"
                    icon="download"
                    accessibilityLabel="Download Shopify Flow"
                   />
                </s-stack>
              </s-grid>
            </s-clickable>
            {/* Featured app 2 */}
            <s-clickable
              href="https://apps.shopify.com/planet"
              border="base"
              borderRadius="base"
              padding="base"
              inlineSize="100%"
              accessibilityLabel="Download Shopify Planet"
            >
              <s-grid
                gridTemplateColumns="auto 1fr auto"
                alignItems="stretch"
                gap="base"
              >
                <s-thumbnail
                  size="small"
                  src="https://cdn.shopify.com/app-store/listing_images/87176a11f3714753fdc2e1fc8bbf0415/icon/CIqiqqXsiIADEAE=.png"
                  alt="Shopify Planet icon"
                 />
                <s-box>
                  <s-heading>Shopify Planet</s-heading>
                  <s-paragraph>Free</s-paragraph>
                  <s-paragraph>
                    Offer carbon-neutral shipping and showcase your commitment.
                  </s-paragraph>
                </s-box>
                <s-stack justifyContent="start">
                  <s-button
                    href="https://apps.shopify.com/planet"
                    icon="download"
                    accessibilityLabel="Download Shopify Planet"
                   />
                </s-stack>
              </s-grid>
            </s-clickable>
          </s-grid>
        </s-section>
      )}
</s-page>
)
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
