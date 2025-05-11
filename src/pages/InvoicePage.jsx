import React from "react";
import { useParams } from "react-router-dom";
import InvoiceGenerator from "../components/InvoiceGenerator";

const InvoicePage = () => {
  const { id } = useParams();
  return (
    <div className="invoice-page-container" style={{ 
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <InvoiceGenerator orderId={id} />
    </div>
  );
};

export default InvoicePage;