// components/pos/ItemCard.jsx
import React from "react";
import "./pos-shared.css";

export default function ItemCard({ meal, onClick }) {
  return (
    <button
      className="pos-card"
      onClick={() => onClick(meal)}
      type="button"
      title={meal?.name}
    >
      <div className="card-title">
        {meal?.icon || "🍽️"} {meal?.name}
      </div>
      <div className="card-price">£{Number(meal?.price || 0).toFixed(2)}</div>
    </button>
  );
}
