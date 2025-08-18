import React, { useEffect, useRef } from 'react';
import './ReceiptPrint.css';
import { useLocation } from 'react-router-dom';

const ReceiptPrint = () => {
  const receiptRef = useRef();
  const location = useLocation();

  // ⛑️ Fallbacks in case state is missing
  const {
    tableNumber = 'N/A',
    orderItems = [],
    totalAmount = 0,
    paymentMethod = 'N/A',
    isTakeaway = false
  } = location.state || {};

  useEffect(() => {
    window.print();
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleString('en-GB');
  };

  const formatCurrency = (amount) => `£${amount.toFixed(2)}`;

  return (
    <div ref={receiptRef} className="receipt-container">
      <h2 className="center-text">MAKS OS BISTRO</h2>
      <p className="center-text">www.maksos.com</p>
      <hr />
      <p><strong>{isTakeaway ? 'Takeaway' : `Table: ${tableNumber}`}</strong></p>
      <p>Date: {getCurrentTime()}</p>
      <hr />
      {orderItems.map((item, idx) => (
        <div className="receipt-line" key={idx}>
          <span>{item.name} x{item.quantity}</span>
          <span>{formatCurrency(item.price * item.quantity)}</span>
        </div>
      ))}
      <hr />
      <div className="receipt-line">
        <span><strong>Subtotal</strong></span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
      <div className="receipt-line">
        <span><strong>VAT (0%)</strong></span>
        <span>{formatCurrency(0)}</span>
      </div>
      <div className="receipt-line">
        <span><strong>TOTAL</strong></span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
      <div className="receipt-line">
        <span><strong>Paid via:</strong></span>
        <span>{paymentMethod}</span>
      </div>
      <hr />
      <p className="center-text">Thank you for dining!</p>
      <p className="center-text small">Powered by MAKS OS</p>
    </div>
  );
};

export default ReceiptPrint;
