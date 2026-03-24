import { useFetcher } from "react-router";

function AutomationTable({ automations }) {
  const fetcher = useFetcher();

  const toggleAutomation = (id, enabled) => {
    const formData = new FormData();

    formData.append("intent", "toggleAutomation");
    formData.append("automationId", id);
    formData.append("enabled", String(enabled));

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <s-section>
      <s-card>
        <s-table columns="5">
          <s-table-header-row>
            <s-table-header>Automation</s-table-header>
            <s-table-header>Optimized Fields</s-table-header>
            <s-table-header>Runs</s-table-header>
            <s-table-header>Created</s-table-header>
            <s-table-header>Enable</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {automations.map((a) => (
              <s-table-row key={a.id}>
                <s-table-cell>{a.name}</s-table-cell>

                <s-table-cell>
                  {[
                    a.optimizeTitle && "Title",
                    a.optimizeDescription && "Description",
                    a.optimizeAltText && "Alt Text",
                    a.optimizeSeo && "SEO",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </s-table-cell>

                <s-table-cell>{a.runs?.length ?? 0}</s-table-cell>

                <s-table-cell>
                  {new Date(a.createdAt).toLocaleDateString()}
                </s-table-cell>

                <s-table-cell>
                  <s-switch
                    checked={a.enable}
                    onChange={(e) => toggleAutomation(a.id, e.target.checked)}
                  />
                </s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-card>
    </s-section>
  );
}

export default AutomationTable;