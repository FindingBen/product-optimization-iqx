import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import {
  downgradeToFree,
  getOrCreateSubscription,
  createShopifySubscription,
} from "../models/Subscription.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const subscription = await getOrCreateSubscription(shop);
  const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

  return { subscription, plans };
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const planName = formData.get("planName");

  if (planName === "free") {
    await downgradeToFree(session.shop);
    return { success: true };
  }

  const confirmationUrl = await createShopifySubscription(admin, session.shop, planName);
  return { confirmationUrl };
};

const PLAN_FEATURES = {
  free: [
    "50 optimizations / month",
    "Title, description & alt text",
    "SEO scoring",
    "Manual optimize only",
  ],
  starter: [
    "500 optimizations / month",
    "Title, description & alt text",
    "SEO scoring",
    "Up to 3 automation rules",
    "New product auto-optimize",
    "Priority queue",
  ],
  pro: [
    "Unlimited optimizations",
    "Title, description & alt text",
    "SEO scoring",
    "Unlimited automation rules",
    "New product auto-optimize",
    "Priority queue",
    "Bulk optimization",
    "Early access to new features",
  ],
};

const PLAN_META = {
  free:    { accent: "#6d7175", label: null,       icon: "○" },
  starter: { accent: "#007a5e", label: "Popular",  icon: "◆" },
  pro:     { accent: "#005e9e", label: "Best Value",icon: "★" },
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="7" cy="7" r="7" fill="currentColor" opacity="0.12" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanCard({ plan, currentPlanName, onUpgrade, isLoading }) {
  const features = PLAN_FEATURES[plan.name] ?? [];
  const meta = PLAN_META[plan.name] ?? PLAN_META.free;
  const isCurrent = plan.name === currentPlanName;
  const isDowngrade = plan.price < (PLAN_META[currentPlanName]?.price ?? 0);
  const isPro = plan.name === "pro";

  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      border: isCurrent
        ? `2px solid ${meta.accent}`
        : isPro
        ? "2px solid #1a1a2e"
        : "1.5px solid #e1e3e5",
      background: isPro
        ? "linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 60%, #0d1b2a 100%)"
        : "white",
      padding: "28px 24px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
      boxShadow: isCurrent
        ? `0 0 0 4px ${meta.accent}22`
        : isPro
        ? "0 8px 40px rgba(0,0,0,0.18)"
        : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      cursor: "default",
      flex: "1 1 0",
      minWidth: 240,
      maxWidth: 320,
    }}
    onMouseEnter={(e) => {
      if (!isCurrent) e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
    }}
    >
      {/* Badge */}
      {(meta.label || isCurrent) && (
        <div style={{
          position: "absolute",
          top: -13,
          left: "50%",
          transform: "translateX(-50%)",
          background: isCurrent ? meta.accent : isPro ? "#1a6eb5" : meta.accent,
          color: "white",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "3px 12px",
          borderRadius: 20,
          whiteSpace: "nowrap",
        }}>
          {isCurrent ? "Current Plan" : meta.label}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18, color: isPro ? "#7eb8f7" : meta.accent }}>{meta.icon}</span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isPro ? "#a0b4cc" : "#6d7175",
          }}>
            {plan.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{
            fontSize: 36,
            fontWeight: 800,
            color: isPro ? "white" : "#1a1a1a",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            {plan.price === 0 ? "Free" : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span style={{ fontSize: 13, color: isPro ? "#7a8fa0" : "#8c9196", fontWeight: 400 }}>
              /month
            </span>
          )}
        </div>

        <p style={{
          marginTop: 8,
          fontSize: 12,
          color: isPro ? "#7a8fa0" : "#6d7175",
          lineHeight: 1.5,
        }}>
          {plan.name === "free" && "Get started at no cost."}
          {plan.name === "starter" && "For growing stores optimizing at scale."}
          {plan.name === "pro" && "Full power. No limits. Everything included."}
        </p>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: isPro ? "rgba(255,255,255,0.08)" : "#f1f2f3",
        marginBottom: 20,
      }} />

      {/* Features */}
      <ul style={{
        listStyle: "none",
        padding: 0,
        margin: "0 0 24px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
      }}>
        {features.map((f) => (
          <li key={f} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            fontSize: 12,
            color: isPro ? "#c8d8e8" : "#3d4246",
            lineHeight: 1.4,
          }}>
            <span style={{ color: isPro ? "#7eb8f7" : meta.accent }}>
              <CheckIcon />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div style={{
          textAlign: "center",
          padding: "10px 0",
          fontSize: 12,
          fontWeight: 600,
          color: meta.accent,
          background: `${meta.accent}10`,
          borderRadius: 8,
          border: `1px solid ${meta.accent}30`,
        }}>
          ✓ Active
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.name)}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 8,
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
            transition: "all 0.15s ease",
            background: isPro
              ? "linear-gradient(135deg, #1a6eb5, #0d4f8a)"
              : plan.price === 0
              ? "transparent"
              : meta.accent,
            color: isPro ? "white" : plan.price === 0 ? "#6d7175" : "white",
            border: plan.price === 0 ? "1.5px solid #e1e3e5" : "none",
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.opacity = "0.88";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {isLoading ? "Processing…" : plan.price === 0 ? "Downgrade to Free" : `Upgrade to ${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}`}
        </button>
      )}
    </div>
  );
}

export default function PlansPage() {
  const { subscription, plans } = useLoaderData();
  const fetcher = useFetcher();

  const isLoading = fetcher.state !== "idle";

  const handleUpgrade = (planName) => {
    fetcher.submit({ planName }, { method: "post" });
  };

  // Redirect to Shopify confirmation URL if returned
  if (fetcher.data?.confirmationUrl) {
    window.location.href = fetcher.data.confirmationUrl;
  }

  const currentPlan = subscription?.plan;

  return (
    <s-page heading="Plans & Billing">

      {/* Current plan banner */}
      <s-section>
        <s-card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8c9196" }}>
                Current Plan
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>
                  {currentPlan?.name?.charAt(0).toUpperCase() + currentPlan?.name?.slice(1) ?? "Free"}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: subscription?.status === "active" ? "rgba(0,122,94,0.1)" : "rgba(215,44,13,0.1)",
                  color: subscription?.status === "active" ? "#007a5e" : "#d72c0d",
                  border: `1px solid ${subscription?.status === "active" ? "rgba(0,122,94,0.25)" : "rgba(215,44,13,0.25)"}`,
                }}>
                  {subscription?.status ?? "active"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>
                  {subscription?.optimizationsUsedThisCycle ?? 0}
                  {currentPlan?.monthlyOptimizationLimit !== -1 && (
                    <span style={{ fontSize: 13, fontWeight: 400, color: "#8c9196" }}>
                      /{currentPlan?.monthlyOptimizationLimit ?? 50}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#8c9196", marginTop: 2 }}>Optimizations used</div>
              </div>

              {currentPlan?.monthlyOptimizationLimit !== -1 && (
                <div style={{ display: "flex", alignItems: "center", minWidth: 120 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#8c9196" }}>Usage</span>
                      <span style={{ fontSize: 10, color: "#8c9196" }}>
                        {Math.round(((subscription?.optimizationsUsedThisCycle ?? 0) / (currentPlan?.monthlyOptimizationLimit ?? 50)) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f2f3", overflow: "hidden", width: 120 }}>
                      <div style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${Math.min(((subscription?.optimizationsUsedThisCycle ?? 0) / (currentPlan?.monthlyOptimizationLimit ?? 50)) * 100, 100)}%`,
                        background: ((subscription?.optimizationsUsedThisCycle ?? 0) / (currentPlan?.monthlyOptimizationLimit ?? 50)) > 0.8
                          ? "#d72c0d"
                          : "#007a5e",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </s-card>
      </s-section>

      {/* Plan cards */}
      <s-section>
        <div style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "8px 0 16px",
        }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanName={subscription?.planName ?? "free"}
              onUpgrade={handleUpgrade}
              isLoading={isLoading}
            />
          ))}
        </div>
      </s-section>

      {/* FAQ / notes */}
      <s-section>
        <s-card>
          <s-stack direction="block" gap="base">
            <s-heading>Billing notes</s-heading>
            <s-text tone="subdued">
              Charges are billed through your Shopify account every 30 days. Upgrading takes effect immediately and you are only charged a prorated amount for the remainder of your billing cycle. Downgrading takes effect at the end of your current billing period.
            </s-text>
            <s-text tone="subdued">
              Optimization usage resets at the start of each billing cycle. Unused optimizations do not roll over.
            </s-text>
          </s-stack>
        </s-card>
      </s-section>

    </s-page>
  );
}