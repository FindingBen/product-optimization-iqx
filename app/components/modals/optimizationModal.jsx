import React,{useState,useEffect } from 'react'
import { Modal,TitleBar } from "@shopify/app-bridge-react";

const OptimizeProductModal  = ({showModal, onClose, awaitOptimize, productId}) => {
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    onClose();
    setErrorMsg("");
  };

  const handleOptimize = async () => {
  if (!productId) return;

  setLoading(true);
  try {
    await awaitOptimize(productId);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      closeModal();
    }, 500);
  } catch (err) {
    setLoading(false);
    setErrorMsg("Optimization failed.");
  }
};

  return (
        <Modal
  open={showModal}
  onClose={closeModal}
>
  <TitleBar title="Product optimization confirmation" />

  <div style={{ padding: "20px" }}>
    <p>
      You are about to optimize your product. Do you wish to proceed?
    </p>
  </div>

  <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
    <s-button onClick={closeModal}>
      Close
    </s-button>
    <s-button onClick={handleOptimize}>
      Optimize
    </s-button>
  </div>
</Modal>
  );
};

export default OptimizeProductModal