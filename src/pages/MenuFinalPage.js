import React from 'react';
import { useLocation } from 'react-router-dom';
import './MenuStyles.css'; // You can create this to add fonts/colors later

const MenuFinalPage = () => {
  const location = useLocation();
  const { sections, selectedTemplate } = location.state || {};

  if (!sections || !selectedTemplate) {
    return <div style={{ padding: 30 }}>Missing menu data. Please go back and start again.</div>;
  }

  return (
    <div style={{ padding: 30, backgroundColor: '#fff', color: '#000' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 40 }}>Restaurant Menu</h1>

      {sections.map((section) => (
        <div key={section.name} style={{ marginBottom: 40 }}>
          <h2 style={{ borderBottom: '2px solid #333', paddingBottom: 5 }}>{section.name}</h2>
          {section.items.length === 0 && <p style={{ fontStyle: 'italic' }}>No items added.</p>}
          {section.items.map((meal, index) => (
            <div
              key={meal.id || index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1px dashed #aaa',
                padding: '6px 0'
              }}
            >
              <span>{meal.name}</span>
              <span>£{meal.price?.toFixed(2) || 'N/A'}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 50, display: 'flex', gap: 20 }}>
        <button onClick={() => window.print()} style={buttonStyle}>Print Menu</button>
        <button style={buttonStyle}>Download PDF (Coming Soon)</button>
        <button style={buttonStyle}>Generate QR Code (Coming Soon)</button>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
};

export default MenuFinalPage;
