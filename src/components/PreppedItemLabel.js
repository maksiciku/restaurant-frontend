import React from 'react';
import './PreppedItemLabel.css';

const PreppedItemLabel = ({ item }) => {
  return (
    <div id={`label-${item.id}`} className="label-print-area">
      <div className="label-header">
        <div className="label-brand">MAKS OS</div>
        <div className="label-title">Prepared Food Label</div>
        <div className="label-date">
          {item.date_added ? new Date(item.date_added).toLocaleDateString() : ''}
        </div>
      </div>

      <div className="label-name">{item.name}</div>

      <div className="label-info">
        <p><strong>Qty:</strong> {item.quantity} {item.unit || 'kg'}</p>
        <p><strong>Holding Temp:</strong> {item.hold_temperature}</p>
        <p><strong>Shelf Life:</strong> {item.shelf_life_hours} hrs</p>
        <p><strong>Allergens:</strong> {item.allergens || 'None'}</p>
        <p><strong>Expires:</strong> {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : ''}</p>
      </div>

      <div className="label-footer">
        <span>Prep by: Chef</span>
        <span>Checked ✔️</span>
      </div>
    </div>
  );
};

export default PreppedItemLabel;
