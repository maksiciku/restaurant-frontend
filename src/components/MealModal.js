import React, { useState, useEffect } from 'react';

export default function MealModal({ meal, isOpen, onClose, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [note, setNote] = useState('');

  // Reset fields each time modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOption('');
      setNote('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleAdd = () => {
    onConfirm(meal, selectedOption, note);
    onClose?.();
  };

  const renderOptions = () => {
    if (!meal?.name) return null;

    // Example: Full English bread choice
    if (meal.name.toLowerCase().includes('english')) {
      const opts = ['White Bread', 'Brown Bread'];
      return (
        <div className="flex gap-2 flex-wrap">
          {opts.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelectedOption(opt)}
              className={`pos-button ${selectedOption === opt ? 'active' : ''}`}
              style={{ padding: '0.5rem .8rem' }}
            >
              {selectedOption === opt ? '✅ ' : ''}{opt}
            </button>
          ))}
        </div>
      );
    }

    // Add more per-meal option groups here as needed…

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      {/* Stop backdrop click from closing when clicking inside panel */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>
            Customize: {meal?.name || 'Meal'}
          </h3>
          <button
            type="button"
            aria-label="Close"
            className="icon-btn"
            onClick={onClose}
            style={{ fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        {/* Body (this area will scroll if tall thanks to CSS: overflow:auto; max-height) */}
        <div className="modal-body" style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          {renderOptions()}

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="meal-note" style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
              Note
            </label>
            <textarea
              id="meal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add notes (e.g. no beans)"
              className="form-input"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="pos-button cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pos-button save"
            onClick={handleAdd}
            disabled={!meal}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
