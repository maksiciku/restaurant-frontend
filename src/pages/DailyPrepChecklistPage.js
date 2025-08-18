import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PreppedItemLabel from '../components/PreppedItemLabel';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DailyPrepChecklistPage = () => {
  const [checklist, setChecklist] = useState([]);
  const [preppedItems, setPreppedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklist();
    fetchPreppedItems();
  }, []);

  const fetchChecklist = async () => {
    const res = await axios.get(`${API_BASE}/prepped-items/daily-checklist`);
    setChecklist(res.data.checklist || []);
    setLoading(false);
  };

  const fetchPreppedItems = async () => {
    const res = await axios.get(`${API_BASE}/prepped-items`);
    setPreppedItems(res.data || []);
  };

  const handlePrepare = async (item) => {
    if (window.confirm(`Prepare ${item.to_prepare} ${item.unit} of ${item.prepped_item}?`)) {
      await axios.post(`${API_BASE}/prepped-items/prepare`, {
        name: item.prepped_item,
        batchQuantity: item.to_prepare
      });
      alert(`✅ Prepared ${item.to_prepare} ${item.unit} of ${item.prepped_item}`);
      fetchChecklist();
      fetchPreppedItems();
    }
  };

  const printLabel = (id) => {
    const printContent = document.getElementById(`label-${id}`);
    const WinPrint = window.open('', '', 'width=400,height=600');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <link rel="stylesheet" type="text/css" href="/print.css">
        </head>
        <body>${printContent?.innerHTML}</body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📋 Daily Prep Checklist</h1>

      {checklist.length === 0 ? (
        <p className="text-green-600">✅ All prepped items are ready!</p>
      ) : (
        <ul className="grid gap-4">
          {checklist.map((item, idx) => {
            const preppedItem = preppedItems.find(p => p.name.toLowerCase() === item.prepped_item.toLowerCase());
            if (!preppedItem) return null;

            return (
              <li key={idx} className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded shadow">
                <h3 className="text-lg font-semibold">{item.prepped_item}</h3>
                <p>Needed: {item.needed} {item.unit}</p>
                <p>In Stock: {item.in_stock} {item.unit}</p>
                <p className="text-red-600 font-bold">To Prepare: {item.to_prepare} {item.unit}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handlePrepare(item)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                  >
                    ➕ Mark as Prepped
                  </button>
                  <button
                    onClick={() => printLabel(preppedItem.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                  >
                    🏷️ Print Label
                  </button>
                </div>

                {/* Hidden label render for printing */}
                <div id={`label-${preppedItem.id}`} style={{ display: 'none' }}>
                  <PreppedItemLabel item={preppedItem} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DailyPrepChecklistPage;
