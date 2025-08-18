import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const OrderingHubPage = () => {
  const [orderList, setOrderList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedOrders, setGroupedOrders] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    website: '',
    phone: '',
    contact_name: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, supplierRes, smartOrderRes] = await Promise.all([
          axios.get(`${API_BASE}/stock/order-list`),
          axios.get(`${API_BASE}/suppliers`),
          axios.get(`${API_BASE}/smart-order`)
        ]);
  
        const rawList = stockRes.data.orderList || [];
        console.log("📦 Raw Order List from backend:", rawList);

        if (!Array.isArray(rawList)) {
  console.error("❌ Order list is not an array:", rawList);
  return;
}

        const smartOrders = smartOrderRes.data || {};
  
        const enrichedList = rawList.map(item => {
          let matchedSupplier = null;
          let matchedPrice = null;
  
          // Look up supplier & price from smartOrder data
          for (const [supplierName, items] of Object.entries(smartOrders)) {
            const match = items.find(i =>
                i && i.ingredient && i.ingredient.toLowerCase() === item.ingredient.toLowerCase()
              );              
            if (match) {
              matchedSupplier = supplierName;
              matchedPrice = match.price;
              break;
            }
          }
  
          return {
            ...item,
            supplier: matchedSupplier || 'N/A',
            price: matchedPrice || 'N/A',
            urgency: (() => {
  const current = item.quantity || 0;
  const min = item.minimum_level || 5;

  if (current <= 0) return 'URGENT';
  if (current <= min) return 'Order Soon';
  return 'Can wait';
})(),
            deliveryGap: null,
            fastSwitched: false
          };
        });
  
        setOrderList(enrichedList);
        setSuppliers(supplierRes.data || []);
      } catch (err) {
        console.error('❌ Error loading ordering data:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  
  const getNextDeliveryGap = (deliveryDays) => {
    if (!deliveryDays || deliveryDays.length === 0) return Infinity;
  
    const today = new Date();
    const todayIdx = today.getDay(); // 0 (Sun) to 6 (Sat)
  
    const dayToIndex = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };
  
    const deliveryIndexes = deliveryDays.map(day => dayToIndex[day]);
  
    const gaps = deliveryIndexes.map(idx => (idx - todayIdx + 7) % 7);
    return Math.min(...gaps);
  };
  
  const calculateOrderAmount = (item) => {
  if (!item.minimum_level || !item.quantity) return 0;
  const missing = item.minimum_level - item.quantity;
  return missing > 0 ? Math.ceil(missing) : 0;
};

  const handleRemoveSupplier = async (supplierId) => {
    try {
      const res = await axios.delete(`${API_BASE}/suppliers/${supplierId}`);
      if (res.status === 200) {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        console.log('✅ Supplier deleted');
      } else {
        throw new Error('Unexpected status: ' + res.status);
      }
    } catch (error) {
      alert('❌ Failed to delete supplier');
      console.error(error);
    }
  };  

  const generateSupplierOrderList = () => {
    const grouped = {};
    orderList.forEach(item => {
      const supplier = item.supplier || 'Unknown';
      const price = isNaN(item.price) ? 0 : parseFloat(item.price);

      if (!grouped[supplier]) {
        grouped[supplier] = { items: [], total: 0 };
      }

      grouped[supplier].items.push(item);
      if (!isNaN(price)) {
        grouped[supplier].total += price * item.order_amount;
      }
    });

    setGroupedOrders(grouped);
  };

  const getSubtotal = (items) => {
  return items.reduce((sum, item) => {
    const unitPrice = item.price || 0;
    const orderAmount = calculateOrderAmount(item);
    return sum + unitPrice * orderAmount;
  }, 0).toFixed(2);
};

  const handleAddSupplier = async () => {
    const { name, website, phone, contact_name, delivery_days } = newSupplierData;
  
    if (!name.trim()) return;
  
    try {
      const response = await axios.post(`${API_BASE}/suppliers`, {
        name: name.trim(),
        website: website || '',
        phone: phone || '',
        contact_name: contact_name || '',
        delivery_days: (delivery_days || []).join(',')
      });
  
      const newId = response.data?.supplierId;
  
      setSuppliers(prev => [
        ...prev,
        { id: newId, name, website, phone, contact_name, delivery_days: delivery_days.join(',') }
      ]);
  
      setNewSupplierData({
        name: '',
        website: '',
        phone: '',
        contact_name: '',
        delivery_days: []
      });
  
      setShowForm(false);
    } catch (err) {
      alert('❌ Failed to add supplier');
      console.error(err);
    }
  };  

  const handleChange = (e) => {
    setNewSupplierData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Ordering Hub</h1>
      {loading ? (
        <p>Loading order suggestions...</p>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Supplier Options</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded mb-2"
            >
              {showForm ? 'Hide Suppliers' : 'Manage Suppliers'}
            </button>
            {showForm && (
              <div className="mt-3 bg-white p-4 rounded shadow-md">
                <div className="flex flex-wrap gap-3 max-w-full overflow-x-auto">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-green-100 text-sm px-4 py-2 rounded-full flex items-center"
                    >
                      <span className="mr-2">{supplier.name}</span>
                      <button onClick={() => handleRemoveSupplier(supplier.id)}>Delete</button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  <input type="text" name="name" placeholder="Supplier Name" value={newSupplierData.name} onChange={handleChange} className="border px-3 py-1 rounded w-full" />
                  <input type="text" name="website" placeholder="Website" value={newSupplierData.website} onChange={handleChange} className="border px-3 py-1 rounded w-full" />
                  <input type="text" name="phone" placeholder="Phone Number" value={newSupplierData.phone} onChange={handleChange} className="border px-3 py-1 rounded w-full" />
                  <input type="text" name="contact_name" placeholder="Contact Name" value={newSupplierData.contact_name} onChange={handleChange} className="border px-3 py-1 rounded w-full" />
                </div>
                <div className="mt-4">
                  <label className="font-semibold block mb-2">Delivery Days</label>
                  <div className="flex flex-wrap gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={day}
                          checked={newSupplierData.delivery_days?.includes(day) || false}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewSupplierData(prev => {
                              const current = prev.delivery_days || [];
                              const updated = current.includes(value)
                                ? current.filter(d => d !== value)
                                : [...current, value];
                              return { ...prev, delivery_days: updated };
                            });
                          }}
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleAddSupplier}
                    className="bg-green-600 text-white px-4 py-2 mt-3 rounded"
                  >
                    ➕ Add Supplier
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={generateSupplierOrderList}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-4 font-semibold shadow"
          >
            ⚡ Generate Full Order List
          </button>

          <table className="w-full text-left border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Item</th>
                <th className="p-2">Order Amount</th>
                <th className="p-2">Suggested Supplier</th>
                <th className="p-2">Price</th>
                <th className="p-2">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {orderList.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{item.ingredient}</td>
                  <td className="p-2">{calculateOrderAmount(item)}</td>
                  <td className="p-2">
                    {item.supplier || "Unknown Supplier"}
                    {item.fastSwitched && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                        Switched to Fast Supplier ⚡
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    £
                    {item.price !== 'N/A' && !isNaN(item.price)
                      ? parseFloat(item.price).toFixed(2)
                      : 'N/A'}
                  </td>
                  <td className="p-2">
                    <span className={
                      item.urgency === 'URGENT' ? 'text-red-600 font-bold' :
                      item.urgency === 'Order Soon' ? 'text-orange-500 font-semibold' :
                      'text-green-600'
                    }>
                      {item.urgency === 'URGENT' && '🔴 '}
                      {item.urgency === 'Order Soon' && '🔸 '}
                      {item.urgency === 'Can wait' && '🔷 '}
                      {item.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {groupedOrders && (
            <div className="bg-white shadow-lg p-6 rounded mt-8 print:block">
              <h2 className="text-2xl font-bold mb-4">📦 Grouped Supplier Order</h2>
              {Object.entries(groupedOrders).map(([supplier, data]) => (
                <div key={supplier} className="mb-6 border-b pb-4">
                  <h3 className="text-xl font-semibold mb-2">{supplier}</h3>
                  <ul className="list-disc pl-6">
                    {data.items.map((item, index) => (
                      <li key={index}>
                        {item.ingredient} – {item.order_amount} units @ £
                        {item.price !== 'N/A' && !isNaN(item.price)
                          ? parseFloat(item.price).toFixed(2)
                          : 'N/A'} = £
                        {item.price !== 'N/A' && !isNaN(item.price)
                          ? (item.price * item.order_amount).toFixed(2)
                          : 'N/A'}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-bold">Subtotal: £{data.total.toFixed(2)}</p>
                </div>
              ))}
              <button
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 mt-4 rounded font-semibold"
              >
                🗸️ Print Order Sheet
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE}/ordering-history`, { groupedOrders });
                    alert("✅ Order history saved!");
                  } catch (err) {
                    alert("❌ Failed to save order.");
                    console.error(err);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 mt-2 ml-4 rounded font-semibold"
              >
                📂 Save This Order
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderingHubPage;