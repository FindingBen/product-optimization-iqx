import { useState, useEffect } from "react";

const OptimizationSettings = ({ businessRuleset }) => {
  const [selected, setSelected] = useState([]);

  // Initialize from businessRuleset
  useEffect(() => {
    const initial = [];
    if (businessRuleset?.titleOptimize) initial.push("title");
    if (businessRuleset?.descriptionOptimize) initial.push("description");
    if (businessRuleset?.altTextOptimize) initial.push("alt_text");
    setSelected(initial);
  }, [
    businessRuleset?.titleOptimize,
    businessRuleset?.descriptionOptimize,
    businessRuleset?.altTextOptimize,
  ]);


  const handleChange = (event) => {
    const values = event.currentTarget.values;
    setSelected(values);
  };
 
  return (
    <s-section heading="Optimization settings">
        <s-text variant="bodyMd" color="subdued">
          Select which aspects of your products you want to optimize. You can
          choose to optimize the title, description, and alt text of your
          products. The app will use AI to generate optimized content based on
          the rules you have set in the business ruleset.
        </s-text>
      <s-choice-list
        multiple
        // Controlled component: use "values" for multi-select
        values={selected}
        onChange={handleChange}
      >
        <s-choice value="title">Title</s-choice>
        <s-choice value="description">Description</s-choice>
        <s-choice value="alt_text">Alt text</s-choice>
      </s-choice-list>

      {/* Hidden inputs to submit as booleans */}
      <input
        type="hidden"
        name="titleOptimize"
        value={selected.includes("title")}
      />
      <input
        type="hidden"
        name="descriptionOptimize"
        value={selected.includes("description")}
      />
      <input
        type="hidden"
        name="altTextOptimize"
        value={selected.includes("alt_text")}
      />
    </s-section>
  );
};

export default OptimizationSettings;