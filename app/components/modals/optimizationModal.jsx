import React,{useState,useEffect } from 'react'
import { Modal,TitleBar } from "@shopify/app-bridge-react";

const OptimizeProductModal = ({
  showModal,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal open={showModal} onClose={onClose}>
      <TitleBar title="Product optimization confirmation"/>

      <div style={{ padding: "20px" }}>
        <p>
          You are about to optimize your product. Do you wish to proceed?
        </p>
      </div>

      <div style={{ padding: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <s-button onClick={onClose}>Close</s-button>
        <s-button variant="primary" onClick={onConfirm}>
          Optimize
        </s-button>
      </div>
    </Modal>
  );
};

export default OptimizeProductModal