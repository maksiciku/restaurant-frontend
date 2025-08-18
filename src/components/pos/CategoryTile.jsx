// components/pos/CategoryTile.jsx
import React from "react";
import "./pos-shared.css";

export default function CategoryTile({ icon, name, active, onClick }) {
  return (
    <button
      className={`pos-chip ${active ? "is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className="chip-icon" aria-hidden>{icon || "📦"}</span>
      <span className="chip-label">{name}</span>
    </button>
  );
}
