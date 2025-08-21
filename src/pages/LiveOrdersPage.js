import React, { useEffect, useState } from 'react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './LiveOrdersPage.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchMealIngredients } from '../utils/fetchMealIngredients';
import { ingredientAliases } from '../utils/novaKnowledge';

const DEFAULT_CATS = ['meals', 'drinks', 'desserts'];

const LiveOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [clearedOrders, setClearedOrders] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [activeCategories, setActiveCategories] = useState(DEFAULT_CATS); // start with all on
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isPaused, setIsPaused] = useState(false);
  const [estimatedDelay, setEstimatedDelay] = useState(null);
  const [summaries, setSummaries] = useState({});
// collapsed by default
const [openBatch, setOpenBatch] = useState({});        // { [batchKey]: boolean }
const [openItem, setOpenItem]   = useState({});        // { [`${batchKey}-${i}`]: boolean }

const toggleBatch = (key) => setOpenBatch(prev => ({ ...prev, [key]: !prev[key] }));
const toggleItem  = (key) => setOpenItem(prev => ({ ...prev, [key]: !prev[key] }));

  // --- helpers ---
  const normalize = (s) => (s || '').toString().trim().toLowerCase();
  const uniq = (arr) => Array.from(new Set(arr.map(normalize))).filter(Boolean);

  const resolveOrderCategory = (order) => {
    // Try several fields so this stays compatible across your routes/db
    return normalize(
      order.category_name ||
      order.category ||
      order.pos_category ||
      order.type ||
      'meals'
    );
  };

  const safeBatchKey = (o) =>
    o.batch_id || `${o.table_number || 'unknown'}-${new Date(o.created_at).getTime()}`;

  // --- fetch estimated delay ---
  const fetchEstimatedDelay = async () => {
    try {
      const res = await api.get(`${API_BASE}/kitchen/estimated-delay`);
      setEstimatedDelay(res.data.delay);
    } catch (err) {
      console.error("❌ Failed to fetch estimated delay", err);
    }
  };

  // --- delivery actions ---
  const handleDeliveryAction = async (batchId, status) => {
    try {
      const response = await api.put(
        `${API_BASE}/orders/delivery-status/${batchId}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        toast.success(`Delivery ${status === 'accepted' ? 'accepted' : 'declined'} ✅`);
        fetchOrders();
      }
    } catch (error) {
      console.error('❌ Failed to update delivery status', error);
      toast.error('Error updating delivery status');
    }
  };

  // --- fetch categories (custom + defaults) ---
  useEffect(() => {
    axios
      .get(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        const data = res.data;
        const extracted = Array.isArray(data) ? data : data.categories;
        // Accept arrays of strings OR objects {name, type}
        const custom = Array.isArray(extracted)
          ? extracted.map((c) => (typeof c === 'string' ? c : c?.name))
          : [];
        const all = uniq([...DEFAULT_CATS, ...custom]);
        setCategories(all);

        // if we already had active categories, intersect with new list to avoid stale items
        setActiveCategories((prev) => {
          const next = prev?.length ? prev : DEFAULT_CATS;
          return all.filter((c) => next.includes(c));
        });
      })
      .catch((err) => {
        console.error("❌ Failed to load categories:", err);
        setCategories(DEFAULT_CATS);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    summarizeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const fetchOrders = () => {
    axios
      .get(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        let fetched = res.data;

        if (Array.isArray(fetched)) {
          fetched = fetched.filter((order) => {
            const oc = resolveOrderCategory(order);
            return (
              activeCategories.includes(oc) &&
              (order.order_type !== 'delivery' || order.delivery_status !== 'declined')
            );
          });

          setOrders(
            fetched.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          );
        } else {
          setOrders([]);
        }
      })
      .catch((err) => console.error('❌ Failed to fetch orders', err));
  };

  const summarizeAll = async () => {
    const result = {};

    const grouped = orders.reduce((acc, order) => {
      const key = safeBatchKey(order);
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {});

    for (const [batchKey, batchItems] of Object.entries(grouped)) {
      const summary = {};

      for (const item of batchItems) {
        const ingredients = await fetchMealIngredients(item.meal_name);
        ingredients.forEach(({ ingredient_name }) => {
          const lower = ingredient_name.toLowerCase();
          const base =
            Object.keys(ingredientAliases).find((k) => lower.includes(k)) ||
            ingredient_name;
          const label = ingredientAliases[base] || base;
          summary[label] = (summary[label] || 0) + item.quantity;
        });
      }

      result[batchKey] = summary;
    }

    setSummaries(result);
  };

  const getElapsedTimeWithColor = (createdAt) => {
    const timestamp = new Date(createdAt);
    const now = new Date();
    const diff = Math.max(0, now - timestamp);
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    let color = '';
    if (hours >= 1 || mins >= 10) color = 'text-red-500';
    else if (mins >= 5) color = 'text-yellow-500';
    else color = 'text-green-500';

    return { text: `${hours}h ${mins}m ${secs}s`, color };
  };

  // Normalize per-item options / notes no matter backend naming
const getItemOptions = (item) => {
  return (
    item.options ??
    item.option ??
    item.customizations ??
    item.choices ??
    item.options_text ??
    item.optionsJSON ??
    item.options_json ??
    null
  );
};

const getItemNote = (item) => {
  return (
    item.note ??
    item.notes ??
    item.comment ??
    item.special_instructions ??
    item.instructions ??
    null
  );
};

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updated = Array.from(orders);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setOrders(updated);
  };

  const deleteOrder = async (id) => {
    try {
      await api.delete(`${API_BASE}/orders/${id}`);
      fetchOrders();
      setClearedOrders((prev) => [...prev, orders.find((o) => o.id === id)]);
    } catch (err) {
      console.error('❌ Failed to delete order', err);
    }
  };

  const clearAllOrders = async () => {
    try {
      await api.delete(`${API_BASE}/orders/clear-all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setClearedOrders((prev) => [...prev, ...orders]);
      setOrders([]);
    } catch (err) {
      console.error('❌ Failed to clear all orders', err);
    }
  };

  const restoreLastOrder = () => {
    if (clearedOrders.length === 0) return;
    const last = clearedOrders[clearedOrders.length - 1];
    setClearedOrders((prev) => prev.slice(0, -1));
    setOrders((prev) => [...prev, last]);
  };

  useEffect(() => {
    fetchOrders();
    fetchPauseStatus();
    fetchEstimatedDelay();
    const interval = setInterval(() => {
      fetchOrders();
      fetchEstimatedDelay();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategories]);

  const toggleCategory = (cat) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const selectAll = () => setActiveCategories(categories);
  const selectNone = () => setActiveCategories([]);

  const reportItem = async (orderId, itemName, quantity) => {
    const reason = prompt("Reason? (Broken, Waste, Refund, Complaint)");
    if (!reason) return;

    const redo = window.confirm("Do you want to redo this order?");

    try {
      await api.post(`${API_BASE}/reports`, {
        order_id: orderId,
        item_name: itemName,
        reason,
        reported_by: "Max",
        quantity,
        redo
      });

      alert("✅ Report logged.");
    } catch (err) {
      console.error("❌ Failed to log report", err);
      alert("Failed to log report");
    }
  };

  const fetchPauseStatus = async () => {
    try {
      const res = await api.get(`${API_BASE}/kitchen/pause-status`);
      setIsPaused(res.data.is_paused);
    } catch (err) {
      console.error("❌ Failed to fetch pause status", err);
    }
  };

  const togglePause = async () => {
    try {
      await api.put(`${API_BASE}/kitchen/pause-status`, { is_paused: !isPaused });
      setIsPaused(!isPaused);
    } catch (err) {
      console.error("❌ Failed to update pause status", err);
    }
  };

  const Sidebar = () => (
    <div className="live-sidebar">
      <h2 className="live-sidebar-title">Categories</h2>

      <div className="flex gap-2 mb-4">
        <button className="btn-mini" onClick={selectAll}>All</button>
        <button className="btn-mini" onClick={selectNone}>None</button>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium capitalize">{cat}</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={activeCategories.includes(cat)}
              onChange={() => toggleCategory(cat)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      ))}
    </div>
  );

  return (
    <div className="live-orders-wrapper">
      <Sidebar />
      <div className="live-orders-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📡 Live Kitchen Display</h2>
          <div className="flex gap-2">
            <button className="bg-red-600 text-white py-2 px-4 rounded" onClick={clearAllOrders}>Clear All</button>
            <button className="bg-blue-600 text-white py-2 px-4 rounded" onClick={restoreLastOrder}>Restore</button>
            <button
              className={`py-2 px-4 rounded ${isPaused ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}
              onClick={togglePause}
            >
              {isPaused ? 'Paused ❌' : 'Pause Orders'}
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="orders" direction="horizontal">
            {(provided) => (
              <div className="horizontal-scroll" {...provided.droppableProps} ref={provided.innerRef}>
                {Object.values(
                  orders.reduce((acc, order) => {
                    if (order.order_type === 'delivery' && order.delivery_status === 'declined') return acc;
                    const key = safeBatchKey(order);
                    if (!acc[key]) {
                      acc[key] = {
                        id: key,
                        batch_id: order.batch_id,
                        table_number: order.table_number,
                        created_at: order.created_at,
                        paid: order.paid,
                        order_type: order.order_type,
                        delivery_status: order.delivery_status,
                        delivery_code: order.delivery_code,
                        items: []
                      };
                    }
                    acc[key].items.push(order);
                    return acc;
                  }, {})
                )
                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                  .map((batch, index) => {
                    const { text, color } = getElapsedTimeWithColor(batch.created_at);
                    const dragId = String(batch.batch_id || batch.id); // always defined
                    const summaryKey = batch.batch_id || batch.id;

                    return (
                      <Draggable key={dragId} draggableId={dragId} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="order-card"
                          >
                            <div className="card-controls">
  <button
    onClick={() =>
      reportItem(batch.items[0]?.id, batch.items[0]?.meal_name, batch.items[0]?.quantity)
    }
    className="control-btn control-btn--report"
    aria-label="Report an issue"
    title="Report an issue"
  >
    ⚠️
  </button>

  <div className="card-controls__spacer" />

  <button
    onClick={() => batch.items.forEach((item) => deleteOrder(item.id))}
    className="control-btn control-btn--remove"
    aria-label="Remove card"
    title="Remove card"
  >
    ❌
  </button>
</div>

                            <div className="order-card-header">
                              <div className="bg-blue-600 text-white font-bold text-center py-1 rounded mb-2">
                                {batch.order_type === 'delivery'
                                  ? '🚗 DELIVERY'
                                  : batch.order_type === 'collection'
                                  ? '🛍 COLLECTION'
                                  : batch.table_number || 'Table Unknown'}
                              </div>
                              {estimatedDelay && (
                                <div className="text-sm text-gray-600">
                                  Table <span className="font-semibold">{estimatedDelay} </span>
                                </div>
                              )}
                              <div>
                                <span
                                  className={`order-status-dot ${batch.paid ? 'status-paid' : 'status-unpaid'}`}
                                ></span>
                                {batch.paid ? 'Paid' : 'Unpaid'}
                              </div>
                            </div>
                            <div className={`order-time ${color}`}>{text} ago</div>

                            {batch.order_type === 'delivery' && batch.delivery_status !== 'accepted' && (
                              <div className="flex gap-2 my-2">
                                <button
                                  onClick={() => handleDeliveryAction(batch.batch_id, 'accepted')}
                                  className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeliveryAction(batch.batch_id, 'declined')}
                                  className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {batch.delivery_status === 'accepted' && (
                              <div className="text-sm font-semibold text-blue-600">
                                🚗 DELIVERY • Code: {batch.delivery_code || '----'}
                              </div>
                            )}

                            <ul className="text-sm mt-2">
                              {batch.items.map((item, i) => (
                              <li key={i} className="kds-item">
  <div className="kds-item__row">
    <span className="kds-item__name">
      {item.quantity} {item.meal_name}
    </span>

    <span className="kds-item__chips">
      {getItemOptions(item) && <span className="chip chip--opt">Options</span>}
      {getItemNote(item) && <span className="chip chip--note">Note</span>}
    </span>
  </div>

  <div className="kds-item__details">
    {getItemOptions(item) && (
      <div className="detail detail--opt">
        🧾 Options: {typeof getItemOptions(item) === 'string'
          ? getItemOptions(item)
          : JSON.stringify(getItemOptions(item))}
      </div>
    )}
    {getItemNote(item) && (
      <div className="detail detail--note">
        📝 Note: {getItemNote(item)}
      </div>
    )}
  </div>
</li>
  


                              ))}
                            </ul>

                            {/* Collapsible summary */}
<div className="kds-summary">
  <button
    className="kds-summary__toggle"
    onClick={() => toggleBatch(summaryKey)}
    aria-expanded={!!openBatch[summaryKey]}
  >
    🧾 Summary {openBatch[summaryKey] ? '▴' : '▾'}
    <span className="kds-summary__count">
      ({Object.values(summaries[summaryKey] || {}).reduce((a,b)=>a+b,0) || 0})
    </span>
  </button>

  {openBatch[summaryKey] && (
    <ul className="kds-summary__list">
      {(summaries[summaryKey] ? Object.entries(summaries[summaryKey]) : [])
        .map(([ingredient, quantity]) => (
          <li key={ingredient}>{quantity}x {ingredient}</li>
        ))
      }
    </ul>
  )}
</div>

                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default LiveOrdersPage;
