import React, { useState } from "react";

export default function optimizationChoiceStep({ onNext, data }) {
  const [businessName, setBusinessName] = useState(data.businessName || "");

  const handleNext = () => {
    if (!businessName) return alert("Please enter a business name");
    onNext({ businessName });
  };

  return (
    <div>
      <h2>What's primary goal for optimization?</h2>
      <input
        type="text"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Enter business name"
      />
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
