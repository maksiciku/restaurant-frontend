import React, { useState } from 'react';
import axios from 'axios';
import { isDrinkItem } from '../utils/classifyItem';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import novaKnowledge from '../utils/novaKnowledge'; // Future use

const InvoiceScanner = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setScannedData(null);
    setEditableItems([]);
    setError(null);
  };

  const handleScan = async () => {
    if (!selectedFile) return setError('No file selected.');

    const formData = new FormData();
    formData.append("invoice", selectedFile); // match `upload.single('invoice')`

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/invoices/scan-preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data;
      if (data.itemsAndPrices?.length > 0) {
        setScannedData(data);
        setEditableItems(
          data.itemsAndPrices.map(item => ({
            description: item.description,
            qty: item.qty,
            price: item.price,
            isDrink: isDrinkItem(item.description),
            quantity_parsed: item.quantity_parsed || '',
            unit: item.unit || '',
            base_ingredient: item.base_ingredient || '',
            portions: item.portions || '',
            suggested_allergens: item.suggested_allergens || 'None',
            type: 'ingredient', // fallback type — user will select
          }))
        );
      } else {
        setError('No valid items found in the scanned data.');
      }
    } catch (err) {
      console.error('❌ Error scanning invoice:', err);
      setError('Failed to scan the invoice. Please try again.');
    }
  };

  const handleEditChange = (index, field, value) => {
    const updated = [...editableItems];
    updated[index][field] = (field === 'qty' || field === 'price') ? Number(value) : value;
    setEditableItems(updated);
  };

  const processEditedItems = async () => {
    for (const item of editableItems) {
      const payload = {
        ingredient: item.description,
        quantity: item.qty,
        price: item.price,
        quantity_parsed: item.quantity_parsed,
        unit: item.unit,
        allergens: item.suggested_allergens || 'None',
        type: item.type || 'ingredient',
      };

      try {
        const route =
          item.type === 'drink'
            ? '/drinks'
            : '/stock';

        await axios.post(`${process.env.REACT_APP_API_URL}${route}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        console.log(`✅ Saved ${item.type}:`, payload);
      } catch (err) {
        console.error(`❌ Failed to save "${item.description}"`, err);
      }
    }

    toast.success("✅ All items processed and saved!");
    setEditableItems([]);
    setScannedData(null);
  };

  return (
    <div className="page-card">
      <h2>📄 Invoice Scanner</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleScan}>🔍 Scan</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {editableItems.length > 0 && (
        <div>
          <h3>📋 Review & Edit Scanned Items</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Parsed Qty</th>
                <th>Unit</th>
                <th>Base Ingredient</th>
                <th>Portions</th>
                <th>Auto Allergens</th>
                <th>Edit Allergens</th>
                <th>Price (£)</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {editableItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleEditChange(index, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleEditChange(index, 'qty', e.target.value)}
                    />
                  </td>
                  <td>{item.quantity_parsed}</td>
                  <td>{item.unit}</td>
                  <td>{item.base_ingredient}</td>
                  <td>{item.portions}</td>
                  <td>{item.suggested_allergens}</td>
                  <td>
                    <input
                      type="text"
                      value={item.suggested_allergens}
                      onChange={(e) => handleEditChange(index, 'suggested_allergens', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleEditChange(index, 'price', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={item.type}
                      onChange={(e) => handleEditChange(index, 'type', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="ingredient">🥦 Ingredient</option>
                      <option value="drink">🥤 Drink</option>
                      <option value="dessert">🍰 Dessert</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={processEditedItems} style={{ marginTop: '1rem' }}>
            ✅ Save Changes & Process Items
          </button>
        </div>
      )}

      {scannedData?.metadata && (
        <div>
          <h3>🧾 Metadata</h3>
          <ul>
            {Object.entries(scannedData.metadata).map(([key, value], i) => (
              <li key={i}>{key}: {value}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InvoiceScanner;
