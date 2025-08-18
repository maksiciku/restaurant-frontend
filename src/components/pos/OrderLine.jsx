// src/components/pos/OrderLine.jsx
export default function OrderLine({ item, onInc, onDec, onRemove, onEdit, onNote, onDiscount, onMore }) {
  const line = Number(item.price || 0) * Number(item.quantity || 1);
  return (
    <div className="pos-line">
      <div className="pos-line-main">
        <div className="pos-line-name">{item.name}</div>
        <div className="pos-line-right">£{line.toFixed(2)}</div>
      </div>

      <div className="pos-line-controls">
        <div className="pos-stepper">
          <button onClick={onDec} aria-label="decrease">−</button>
          <span>{item.quantity}</span>
          <button onClick={onInc} aria-label="increase">＋</button>
        </div>

        <div className="pos-line-mini">
          <button onClick={onEdit}>Edit</button>
          <button onClick={onNote}>Note</button>
          <button onClick={onDiscount}>Disc</button>
          <button className="pos-line-kebab" onClick={onMore}>⋮</button>
        </div>

        <button className="pos-line-trash" onClick={onRemove}>🗑</button>
      </div>
    </div>
  );
}
