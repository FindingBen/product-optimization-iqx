import { useState } from "react";

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  completed: { label: "Completed", color: "#007a5e", bg: "rgba(0,122,94,0.1)", border: "rgba(0,122,94,0.25)", dot: "#007a5e" },
  failed:    { label: "Failed",    color: "#d72c0d", bg: "rgba(215,44,13,0.1)", border: "rgba(215,44,13,0.25)", dot: "#d72c0d" },
  running:   { label: "Running",   color: "#0060b8", bg: "rgba(0,96,184,0.1)",  border: "rgba(0,96,184,0.25)", dot: "#0060b8" },
  pending:   { label: "Pending",   color: "#6d7175", bg: "rgba(0,0,0,0.05)",    border: "rgba(0,0,0,0.1)",     dot: "#c4cdd5" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 9px",
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.03em",
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.dot,
        boxShadow: status === "running" ? `0 0 0 3px ${cfg.border}` : "none",
        animation: status === "running" ? "pulse 1.5s infinite" : "none",
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

function Duration({ startedAt, completedAt }) {
  if (!startedAt) return <span style={{ color: "#8c9196" }}>—</span>;
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = Math.round((end - new Date(startedAt)) / 1000);
  if (secs < 60) return <span>{secs}s</span>;
  return <span>{Math.floor(secs / 60)}m {secs % 60}s</span>;
}

function ShortId({ id }) {
  return (
    <span style={{
      fontFamily: "monospace",
      fontSize: 11,
      background: "#f1f2f3",
      padding: "2px 6px",
      borderRadius: 4,
      color: "#5c5f62",
    }}>
      {id.slice(0, 8)}…
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function PaginationButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 6,
        border: "1px solid #e1e3e5",
        background: disabled ? "#f6f6f7" : "white",
        color: disabled ? "#c4cdd5" : "#1a1a1a",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        lineHeight: 1.5,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f6f6f7"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "white"; }}
    >
      {children}
    </button>
  );
}

function PageNumber({ page, current, onClick }) {
  const active = page === current;
  return (
    <button
      onClick={() => onClick(page)}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: active ? "1px solid #005e46" : "1px solid transparent",
        background: active ? "#f0faf7" : "transparent",
        color: active ? "#005e46" : "#6d7175",
        fontWeight: active ? 600 : 400,
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f6f6f7"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {page}
    </button>
  );
}

function AutomationRunsTable({ runs = [] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(runs.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageRuns = runs.slice(start, start + PAGE_SIZE);

  // Build page number list with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }
    return pages;
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .run-row:hover { background: #fafbfb; }
      `}</style>

      <s-section>
        <s-card padding="none">
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}>
              <thead>
                <tr>
                  {["Run ID", "Product ID", "Status", "Duration", "Started", "Completed"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#6d7175",
                      background: "#f6f6f7",
                      borderBottom: "1px solid #e1e3e5",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {pageRuns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: "#8c9196",
                      fontSize: 13,
                    }}>
                      No automation runs yet
                    </td>
                  </tr>
                ) : (
                  pageRuns.map((run) => (
                    <tr
                      key={run.id}
                      className="run-row"
                      style={{ borderBottom: "1px solid #f1f2f3", transition: "background 0.15s ease" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <ShortId id={run.id} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <ShortId id={run.productId} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={run.status} />
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#1a1a1a" }}>
                        <Duration startedAt={run.startedAt} completedAt={run.completedAt} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {run.startedAt ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 12, color: "#1a1a1a" }}>{formatDate(run.startedAt)}</span>
                            <span style={{ fontSize: 11, color: "#8c9196" }}>{formatTime(run.startedAt)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#8c9196" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {run.completedAt ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 12, color: "#1a1a1a" }}>{formatDate(run.completedAt)}</span>
                            <span style={{ fontSize: 11, color: "#8c9196" }}>{formatTime(run.completedAt)}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#8c9196" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with pagination */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #f1f2f3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}>
            {/* Count */}
            <span style={{ fontSize: 12, color: "#8c9196" }}>
              {runs.length === 0
                ? "0 runs"
                : `${start + 1}–${Math.min(start + PAGE_SIZE, runs.length)} of ${runs.length} run${runs.length !== 1 ? "s" : ""}`
              }
            </span>

            {/* Pagination controls — only show if more than one page */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <PaginationButton onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ← Prev
                </PaginationButton>

                {getPageNumbers().map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: "#8c9196", padding: "0 4px" }}>…</span>
                  ) : (
                    <PageNumber key={p} page={p} current={page} onClick={setPage} />
                  )
                )}

                <PaginationButton onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  Next →
                </PaginationButton>
              </div>
            )}
          </div>
        </s-card>
      </s-section>
    </>
  );
}

export default AutomationRunsTable;