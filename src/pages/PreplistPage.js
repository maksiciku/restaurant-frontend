import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PreppedItemLabel from '../components/PreppedItemLabel';
import '../styles/PreplistPage.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PreplistPage = () => {
  const [preppedItems, setPreppedItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', ingredients: [{ ingredient: '', amount: 0 }] });
  const [autocomplete, setAutocomplete] = useState({});
  const [todayPrepList, setTodayPrepList] = useState([]);

  useEffect(() => {
    fetchPreppedItems();
    fetchTodayPrepList();
  }, []);

  const fetchPreppedItems = async () => {
    const res = await axios.get(`${API_BASE}/prepped-items`);
    setPreppedItems(res.data);
  };

  const fetchTodayPrepList = async () => {
    const res = await axios.get(`${API_BASE}/prepped-items/daily-checklist`);
    setTodayPrepList(res.data.checklist || []);
  };

  const addIngredientField = () => {
    setNewItem(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient: '', amount: 0 }]
    }));
  };

  const updateIngredient = (index, field, value) => {
    const updatedIngredients = [...newItem.ingredients];
    updatedIngredients[index][field] = value;
    setNewItem(prev => ({ ...prev, ingredients: updatedIngredients }));
  };

  const savePreppedItem = async () => {
    await axios.post(`${API_BASE}/prepped-items`, newItem);
    setNewItem({ name: '', ingredients: [{ ingredient: '', amount: 0 }] });
    fetchPreppedItems();
    fetchTodayPrepList();
  };

  const prepareBatch = async (name) => {
    const qty = parseFloat(prompt('Enter batch quantity (kg):'));
    if (!qty) return;
    await axios.post(`${API_BASE}/prepped-items/prepare`, { name, batchQuantity: qty });
    fetchPreppedItems();
    fetchTodayPrepList();
  };

  const printLabel = (id) => {
    const printContent = document.getElementById(`label-${id}`);
    const WinPrint = window.open('', '', 'width=400,height=600');
    WinPrint.document.write(`
      <html>
        <head><title>Print Label</title><link rel="stylesheet" type="text/css" href="/print.css"></head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prepped item?')) return;
    try {
      await axios.delete(`${API_BASE}/prepped-items/${id}`);
      fetchPreppedItems();
      fetchTodayPrepList();
    } catch (error) {
      alert('❌ Failed to delete item');
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 via-gray-50 to-white min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">🥣 Prepped Items</h1>

      <h2 className="text-2xl font-bold text-teal-700 mb-4">📋 Today's Prep List</h2>
      {todayPrepList.length === 0 ? (
        <p className="text-green-600">✅ All prepped items are stocked up!</p>
      ) : (
        <ul className="grid gap-4 mb-10">
          {todayPrepList.map(item => (
            <li key={item.prepped_item} className="p-4 bg-white border border-yellow-300 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-700">{item.prepped_item}</h3>
              <p className="text-sm text-gray-600">Current Stock: {item.in_stock} {item.unit || 'kg'}</p>
              <button
                onClick={() => prepareBatch(item.prepped_item)}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded shadow"
              >
                ➕ Prepare Now
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Add New Prepped Item</h2>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
          className="border p-2 mb-2 w-full"
        />

        {newItem.ingredients.map((ing, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ingredient"
                value={ing.ingredient}
                onChange={async (e) => {
                  updateIngredient(idx, 'ingredient', e.target.value);
                  if (e.target.value.length >= 2) {
                    const res = await axios.get(`${API_BASE}/stock/search?q=${e.target.value}`);
                    setAutocomplete(prev => ({ ...prev, [idx]: res.data }));
                  } else {
                    setAutocomplete(prev => ({ ...prev, [idx]: [] }));
                  }
                }}
                className="border p-2 w-full"
              />
              {autocomplete[idx]?.length > 0 && (
                <div className="absolute bg-white border mt-1 rounded shadow z-10 max-h-40 overflow-y-auto">
                  {autocomplete[idx].map((suggestion, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        updateIngredient(idx, 'ingredient', suggestion);
                        setAutocomplete(prev => ({ ...prev, [idx]: [] }));
                      }}
                      className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Amount (kg)"
              value={ing.amount}
              onChange={e => updateIngredient(idx, 'amount', parseFloat(e.target.value))}
              className="border p-2 w-24"
            />
          </div>
        ))}

        <input
          type="text"
          placeholder="Holding Temperature (e.g., 0-5°C)"
          value={newItem.hold_temperature || ''}
          onChange={e => setNewItem(prev => ({ ...prev, hold_temperature: e.target.value }))}
          className="border p-2 mb-2 w-full"
        />

        <input
          type="number"
          placeholder="Shelf Life (hours)"
          value={newItem.shelf_life_hours || ''}
          onChange={e => setNewItem(prev => ({ ...prev, shelf_life_hours: parseInt(e.target.value) }))}
          className="border p-2 mb-2 w-full"
        />

        <div className="flex gap-2">
          <button onClick={addIngredientField} className="bg-blue-500 text-white px-4 py-2 rounded">+ Add Ingredient</button>
          <button onClick={savePreppedItem} className="bg-green-600 text-white px-4 py-2 rounded">Save Prepped Item</button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">📦 All Prepped Items</h2>
      <div className="grid gap-4">
        {preppedItems.map(item => (
          <div key={item.id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
            <PreppedItemLabel item={item} />
            <div className="flex gap-2 items-center">
              <button onClick={() => prepareBatch(item.name)} className="text-gray-600 hover:text-green-600" title="Prepare Batch">➕</button>
              <button onClick={() => printLabel(item.id)} className="text-gray-600 hover:text-blue-600" title="Print Label">🏷️</button>
              <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-600" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreplistPage;
