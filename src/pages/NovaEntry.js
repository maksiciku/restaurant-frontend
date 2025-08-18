import React, { useState } from 'react';
import axios from 'axios';

const NovaEntry = () => {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);

   const handleDelete = (indexToDelete) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== indexToDelete));
  };

  const addItem = () => {
    setItems([...items, {
      raw_name: "",
      base_name: "",
      unit: "",
      quantity: "",
      category: "",
      allergens: "",
      supplier: ""
    }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSave = async () => {
    try {
       await axios.post(`http://${window.location.hostname}:5000/nova/save-trained-items`, { items });
        alert('✅ Nova trained successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Error saving data');
    }
  };

  const handleScan = async () => {
  if (!file) return alert("Please upload an invoice image");

  const formData = new FormData();
  formData.append('invoice', file);

  try {
    const res = await axios.post(`http://${window.location.hostname}:5000/invoices/scan-preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log("🔍 Raw Scan Response:", res.data);

    const scannedLines = res.data?.lines || [];

    const scannedItems = scannedLines.map((item, idx) => {
      console.log(`🔍 Line ${idx}:`, item); // Add this
      if (!item || typeof item !== 'object') {
        return {
          raw_name: typeof item === 'string' ? item : '',
          base_name: '',
          unit: '',
          quantity: '',
          category: '',
          allergens: '',
          supplier: ''
        };
      }

      return {
        raw_name: item.description || '',
        base_name: item.base_ingredient || '',
        unit: item.unit || item.units || '',
        quantity: item.quantity_parsed || item.qty || '',
        category: '',
        allergens: item.suggested_allergens || '',
        supplier: ''
      };
    });

    console.log("✅ Parsed Items:", scannedItems);
setItems(prev => [...prev, ...scannedItems]);
  } catch (err) {
    console.error("❌ Scan failed:", err.message);
    alert("Failed to scan invoice");
  }
};


  return (
    <div style={{ padding: '20px' }}>
      <h2>🧠 Nova Core Trainer + Invoice Scanner</h2>

      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleScan} style={{ marginLeft: '10px' }}>📷 Scan Invoice</button>
      </div>

      <button onClick={addItem} style={{ marginBottom: '20px' }}>➕ Add Product Manually</button>

      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: '25px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Scanned:</strong> {item.raw_name || '[Blank]'}</p>
          <input placeholder="Full Product Name" value={item.raw_name} onChange={e => handleChange(index, 'raw_name', e.target.value)} />
          <input placeholder="Base Name (e.g. water)" value={item.base_name} onChange={e => handleChange(index, 'base_name', e.target.value)} />
          <input placeholder="Unit Size (e.g. 330ml)" value={item.unit} onChange={e => handleChange(index, 'unit', e.target.value)} />
          <input placeholder="Quantity (e.g. 24)" value={item.quantity} onChange={e => handleChange(index, 'quantity', e.target.value)} />
          <input placeholder="Category (drink, veg, dairy…)" value={item.category} onChange={e => handleChange(index, 'category', e.target.value)} />
          <input placeholder="Allergens (comma-separated or 'none')" value={item.allergens} onChange={e => handleChange(index, 'allergens', e.target.value)} />
          <input placeholder="Supplier Name" value={item.supplier} onChange={e => handleChange(index, 'supplier', e.target.value)} />
          <button 
  onClick={() => handleDelete(index)} 
  style={{ marginTop: '10px', background: '#e53935', color: 'white', padding: '5px 10px', borderRadius: '5px' }}
>
  🗑️ Delete Item
</button>
        </div>
      ))}

      {items.length > 0 && (
        <button onClick={handleSave} style={{ padding: '10px 20px', fontSize: '16px' }}>💾 Save & Teach Nova</button>
      )}
    </div>
  );
};

export default NovaEntry;
