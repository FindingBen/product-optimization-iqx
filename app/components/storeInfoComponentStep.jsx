import React, { useState } from "react";

export default function StoreInfoComponentStep({ onNext, data }) {
  const [storeDescription, setStoreDescription] = useState(
    data.storeDescription || ""
  );

  const handleNext = () => {
    if (!storeDescription)
      return alert("Please describe your store");

    onNext({ storeDescription });
  };

  return (
    <div className="mx-10">
      <h2>Describe your store</h2>

      <s-text-area
        maxLength={100}
        placeholder="Write..."
        value={storeDescription}
        rows={3}
        onChange={(e) => setStoreDescription(e.target.value)}
      />

      <button onClick={handleNext}>Next</button>
    </div>
  );
}
