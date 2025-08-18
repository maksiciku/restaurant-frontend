// components/TableMapModal.js
import React from 'react';
import './TableMapModal.css'; // You can style it like a popup

const TableMapModal = ({ tables, onSelect, onClose }) => {
  return (
    <div className="tablemap-modal-backdrop">
      <div className="tablemap-modal">
        <h3>Select Table to Transfer To</h3>
        <div className="table-grid">
          {tables.map((table) => (
            <button
              key={table.name}
              className="table-button"
              onClick={() => onSelect(table.name)}
            >
              {table.name}
            </button>
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default TableMapModal;
