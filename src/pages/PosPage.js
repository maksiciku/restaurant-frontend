import api from '../api';
import MealModal from '../components/MealModal';
import './PosPage.css';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import ReceiptPage from './ReceiptPage';
import { useNavigate } from 'react-router-dom'; // make sure this is at the top
import TableMapModal from '../components/TableMapModal';
import CategoryTile from '../components/pos/CategoryTile';
import ItemCard from '../components/pos/ItemCard';
import OrderLine from '../components/pos/OrderLine';


const PosPage = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [meals, setMeals] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('meals');
  const [tableTotal, setTableTotal] = useState(0);
  const [loadedFromDB, setLoadedFromDB] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { id } = useParams(); // Table ID from URL
  const location = useLocation();
  const [orderType, setOrderType] = useState('dine-in'); // 'dine-in', 'takeaway', 'delivery'

  const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableName, setSelectedTableName] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]);
  const printRef = useRef();
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [splitByPeopleModalOpen, setSplitByPeopleModalOpen] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [totalBill, setTotalBill] = useState(0);
  const [sharePerPerson, setSharePerPerson] = useState(0);
  const [personIndex, setPersonIndex] = useState(1); // Current person paying
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate(); // inside your component
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash'); // or 'Card'
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [isTakeawaySelected, setIsTakeawaySelected] = useState(false);
const [selectedItemsToPay, setSelectedItemsToPay] = useState([]);
const [isTakeaway, setIsTakeaway] = useState(false);
const [unpaidOrders, setUnpaidOrders] = useState([]);
const [showTransferModal, setShowTransferModal] = useState(false);
const [newTable, setNewTable] = useState("");
const [showTransferMap, setShowTransferMap] = useState(false);
const [tables, setTables] = useState([]);
const [showSplitOptions, setShowSplitOptions] = useState(false);
const [flipLayout, setFlipLayout] = useState(false);
const [currentOrder, setCurrentOrder] = useState([]);
const [categories, setCategories] = useState([]);
const [newCategoryName, setNewCategoryName] = useState('');
const [newCategoryType, setNewCategoryType] = useState('meal');
const [newCategoryIcon, setNewCategoryIcon] = useState('🍽️');
const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [newCategory, setNewCategory] = useState({ name: '', icon: '', type: 'meal' });
const [showMiscModal, setShowMiscModal] = useState(false);
const [miscName, setMiscName] = useState('');
const [miscPrice, setMiscPrice] = useState('');
const [search, setSearch] = useState('');
const [showOthers, setShowOthers] = useState(false);
const [showComplaint, setShowComplaint] = useState(false);
const [complaint, setComplaint] = useState({ order_id:'', item_name:'', reason:'', reported_by:'', quantity:1, redo:false });
const [showPayChooser, setShowPayChooser] = useState(false);
const [showSplitChooser, setShowSplitChooser] = useState(false);

// Held orders
const [heldOpen, setHeldOpen] = useState(false);
const [heldOrders, setHeldOrders] = useState([]);

// Discounts & service charge
const [showDiscountModal, setShowDiscountModal] = useState(false);
const [discountValue, setDiscountValue] = useState('');      // user input
const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'amount'
const [serviceOn, setServiceOn] = useState(false);
const [serviceRate, setServiceRate] = useState(10);          // default 10%

  useEffect(() => {
  if (tableTotal === 0 && selectedTable) {
    setPreviousOrders([]); // clear full bill
  }
}, [tableTotal, selectedTable]);

  useEffect(() => {
  const stored = sessionStorage.getItem(`cart_table_${selectedTableId}`);
  if (stored) setCart(JSON.parse(stored));
}, [selectedTableId]);

useEffect(() => {
  if (selectedTableId) {
    sessionStorage.setItem(`cart_table_${selectedTableId}`, JSON.stringify(cart));
  }
}, [cart, selectedTableId]);

  useEffect(() => {
  if (!selectedTableId) {
    setOrderType('takeaway');
  } else {
    setOrderType('dine-in');
  }
}, [selectedTableId]);

useEffect(() => {
  if (categories.length > 0) {
    fetchItemsByCategory(categories[0].name);
  }
}, [categories]);

  useEffect(() => {
    if (id && !selectedTable) {
      setSelectedTable(parseInt(id));  // make sure it's a number
      setLoadedFromDB(false);        // force the unpaid-orders fetch
    }
  }, [id, selectedTable]);

    const fetchItemsByCategory = async (category) => {
  try {
    const token = localStorage.getItem('token');
    const res = await api.get(`${API}/meals?category=${encodeURIComponent(category)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMeals(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error('❌ Failed to fetch items by category:', err);
    setMeals([]);
  }
};

    useEffect(() => {
    if (selectedTable) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/tables/${selectedTable}/total`)
        .then((res) => setTableTotal(res.data.total || 0))
        .catch((err) => setTableTotal(0));
    }
  }, [selectedTable]);

  useEffect(() => {
  const fetchTables = async () => {
    try {
      const res = await api.get('http://localhost:5000/tables');
      setTables(res.data);
    } catch (err) {
      console.error('❌ Failed to load tables:', err);
    }
  };

  fetchTables();
}, []);

  useEffect(() => {
    if (!selectedTable || loadedFromDB) return;
  
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }
  
    console.log('🟢 Fetching unpaid orders for table:', selectedTable);
  
    axios
      .get(`${process.env.REACT_APP_API_URL}/orders/by-table/${encodeURIComponent(selectedTable)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
  const existingItems = res.data || [];

  // Save full raw data for bill view
  setPreviousOrders(existingItems);

  // Still group cart for editing/view
  const grouped = {};
  existingItems.forEach((item) => {
    const key = `${item.meal_name}-${parseFloat(item.total_price) / item.quantity}`;
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        name: item.meal_name,
        quantity: 0,
        price: parseFloat(item.total_price) / item.quantity,
        category: item.category || 'meals',
        options: item.options,
        note: item.note,
      };
    }
    grouped[key].quantity += item.quantity;
  });

  setCart(Object.values(grouped));
  setLoadedFromDB(true);
})
      .catch((err) => console.error('❌ Failed to load unpaid orders:', err));
  }, [selectedTable, loadedFromDB]);  

  useEffect(() => {
  if (!selectedTable || !isNaN(selectedTable)) return; // already an ID or not set

  const fetchTableId = async () => {
    try {
      const res = await api.get(`${process.env.REACT_APP_API_URL}/tables`);
      const matched = res.data.find(t => t.name === selectedTable);
      if (matched) {
        setSelectedTable(matched.id); // ✅ Save correct ID
      }
    } catch (err) {
      console.error('❌ Failed to fetch tables for ID resolution:', err);
    }
  };

  fetchTableId();
}, [selectedTable]);

useEffect(() => {
  const idFromURL = parseInt(id);
  const state = location.state;

  if (idFromURL && !selectedTableId) {
    setSelectedTableId(idFromURL);
  }

  if (state?.tableName && !selectedTableName) {
    setSelectedTableName(state.tableName);
  }
}, [id, selectedTableId, selectedTableName]);

  const getCategoryMeals = (category) => {
    if (!meals.length) return [];
    if (meals[0].category) {
      return meals.filter((meal) => meal.category?.toLowerCase() === category.toLowerCase());
    }
    return meals;
  };

  useEffect(() => {
  api.get('http://localhost:5000/tables').then(res => {
    setTables(res.data); // Assuming your `/tables` route returns all table names
  });
}, []);


const handleTransferClick = () => {
  setShowTransferMap(true);
};

const handleSelectNewTable = async (newTable) => {
  try {
    await api.put('/pos-orders/transfer-table', {
      oldTable: selectedTable,
      newTable,
    });

    console.log(`✅ Transferred to ${newTable}`);
    setShowTransferMap(false);
    fetchOrders(); // Refresh table orders
  } catch (err) {
    console.error("❌ Failed to transfer table", err);
  }
};

 const handlePrint = () => {
  const printContents = printRef.current.innerHTML;
  const originalContents = document.body.innerHTML;

  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload(); // Reload to fix layout after print
};

const visibleMeals = meals.filter(m =>
  m.name?.toLowerCase().includes(search.toLowerCase())
);

const fetchUnpaidOrders = async (tableNumber) => {
  try {
    const response = await api.get(
      `${API}/orders/by-table/${encodeURIComponent(tableNumber)}`
    );
    setOrders(response.data);
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get(`${API}/categories`);
    setCategories(res.data);
    if (res.data.length) {
      setSelectedCategory(res.data[0].name);
      fetchItemsByCategory(res.data[0].name);
    }
  } catch (err) {
    console.error('❌ Failed to fetch categories:', err);
  }
};

// call it once on mount
useEffect(() => { fetchCategories(); }, []);


 const addToCart = (item, category) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.meal_id === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.meal_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prevCart,
          {
            meal_id: item.id,
            meal_name: item.name,
            name: item.name,
            price: item.price,
            quantity: 1,
            category,
          },
        ];
      }
    });
  };

  const removeFromCart = (meal_id) => {
  setCart((prevCart) => prevCart.filter((item) => item.meal_id !== meal_id));
};

const placeOrder = async () => {
  try {
if (cart.length === 0 || (orderType === 'dine-in' && !selectedTableId)) {
    alert('⚠️ Select a table and add at least one item.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ You are not logged in.');
      return;
    }

    const items = cart.map((item) => ({
  meal_id: item.meal_id,
  meal_name: item.name || item.meal_name,
  quantity: item.quantity,
  total_price: (item.price * item.quantity).toFixed(2),
  category: item.category,
  options: item.options || '',
  note: item.note || '',
}));

    await api.post(`${process.env.REACT_APP_API_URL}/orders/grouped`, {
table_number: orderType === 'dine-in' ? (selectedTableName || selectedTableId) : null,
order_type: orderType,
      items,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await api.post(`${process.env.REACT_APP_API_URL}/tables/${selectedTableId}/status`, {
      status: 'occupied',
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    alert(`✅ Order placed for table ${selectedTableName || selectedTableId}`);
    setCart([]);
    setLoadedFromDB(false);

    const totalRes = await api.get(`${process.env.REACT_APP_API_URL}/tables/${selectedTableId}/total`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setTableTotal(totalRes.data.total || 0);
  } catch (error) {
    console.error('❌ Error placing order:', error.message);
    alert(`❌ Error: ${error.message}`);
  }
};

const handleAddCategory = async () => {
  const { name, type, icon } = newCategory;

  if (!name.trim()) {
    alert("Category name is required");
    return;
  }

  try {
    await api.post(`${process.env.REACT_APP_API_URL}/categories`, {
      name: name.trim(),
      type: type || 'meal',
      icon: icon || '🍽️'
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    // Reset the form
    setNewCategory({ name: '', type: 'meal', icon: '🍽️' });
    setShowCategoryModal(false);
    fetchCategories(); // 🔄 refresh the sidebar
  } catch (err) {
    console.error('❌ Failed to add category:', err);
    alert(err.response?.data?.error || 'Failed to add category');
  }
};

const closeTable = async () => {
  try {
    const res = await api.get(`${process.env.REACT_APP_API_URL}/tables`);
    const selected = res.data.find(t => t.id === selectedTable);
    const tableName = selected?.name || selectedTable;

    // Clear frontend data
    setCart([]);
    setPreviousOrders([]);
    setTableTotal(0); // ✅ Reset the unpaid total
    sessionStorage.removeItem(`cart_table_${selectedTableId}`);
    setLoadedFromDB(false);

    // Backend: clear orders and free table
    await api.post(`${process.env.REACT_APP_API_URL}/orders/close`, {
      table_number: tableName,
    });

    await api.post(`${process.env.REACT_APP_API_URL}/tables/${selectedTable}/status`, {
      status: 'free',
    });

    // Full frontend reset
    setSelectedTable(null);
    setSelectedTableId(null);
    setSelectedTableName(null);
    setSelectedCategory('meals');
    setMeals([]); // ✅ clear loaded meals

    alert(`✅ Table ${tableName} closed successfully!`);
  } catch (error) {
    console.error('❌ Failed to close table:', error.message);
    alert('❌ Something went wrong when closing the table.');
  }
};

const fetchOrders = async () => {
  try {
    const res = await api.get(`${API}/orders/by-table/${encodeURIComponent(selectedTable)}`);
    setPreviousOrders(res.data);
  } catch (err) {
    console.error('❌ Error fetching orders:', err.message);
  }
};

const handleSplitPay = async () => {
  if (selectedItems.length === 0) {
    alert("No items selected to split-pay!");
    return;
  }

  try {
    console.log('🔍 Sending itemIds:', selectedItems);
     const response = await api.post(`${API}/orders/split-pay`, {
   itemIds: selectedItems,
 }, {
   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
 });

    alert('✅ Items paid successfully!');
    setShowSplitModal(false);
    fetchOrders();
    setSelectedItems([]);
  } catch (error) {
    console.error('❌ Error during split payment:', error);
    alert('Failed to pay selected items.');
  }
};

const handleCategoryClick = (name) => {
  setSelectedCategory(name);
  fetchItemsByCategory(name);
};

const handleDeleteCategory = async (id) => {
  if (!window.confirm('Delete this category? This cannot be undone.')) return;
  try {
    await api.delete(`${API}/categories/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    // Hide delete icon and refresh list
    setShowDeleteId(null);
    fetchCategories();
  } catch (err) {
    console.error('❌ Failed to delete category:', err);
    alert(err.response?.data?.error || 'Failed to delete category');
  }
};

  const clearUnpaidOrders = async () => {
    try {
        const res = await api.delete(
            `${process.env.REACT_APP_API_URL}/orders/clear-unpaid/${encodeURIComponent(selectedTable)}`
          );          
      alert(res.data.message || 'Unpaid orders cleared.');
      setCart([]);
      setLoadedFromDB(false);
    } catch (err) {
      console.error('❌ Failed to clear unpaid orders:', err);
      alert('❌ Failed to clear unpaid orders.');
    }
  };

  const handleItemClick = (item) => {
  // You can adjust this logic depending on your POS state structure
  const updatedOrder = {
    ...item,
    quantity: 1,
    total: parseFloat(item.price),
  };
  setCurrentOrder([...currentOrder, updatedOrder]);
};

  const handleModalConfirm = (meal, options, note) => {
  const cartItem = {
    meal_id: meal.id,
    meal_name: meal.name,
    name: meal.name,
    price: meal.price,
    quantity: 1,
    category: meal.category || selectedCategory,
    options,
    note,
  };

  setCart((prevCart) => [...prevCart, cartItem]);
  setShowModal(false);
  setSelectedMeal(null);
};

const handleSplitByPeople = async () => {
  try {
    const response = await api.post(`${API}/orders/split-by-people`, {
      table_number: selectedTable,
      people: peopleCount
    });
    const { total, share } = response.data;
    setTotalBill(total);
    setSharePerPerson(share);
    setPersonIndex(1);
  } catch (error) {
    console.error('❌ Error splitting by people:', error);
  }
};

const handlePayShare = async () => {
  try {
    const response = await api.post(`${API}/orders/pay-share`, {
      table_number: selectedTable,
      amount: sharePerPerson
    });
    console.log(`✅ Person ${personIndex} paid:`, response.data);
    setPersonIndex(prev => prev + 1);
    fetchUnpaidOrders(selectedTable); // Refresh the orders
  } catch (error) {
    console.error('❌ Error paying share:', error);
  }
};

const handleCompletePayment = async () => {
  try {
    const token = localStorage.getItem('token');

    // 1) If there is a cart, place it first
    if (cart.length > 0) {
      await placeOrder(); // already posts grouped & sets table occupied
    }

    // 2) Fetch latest unpaid items for this table/order
    //    If takeaway, your backend may use a pseudo-table or return last order; adjust if needed
    if (!selectedTable) {
      // If you also support pure takeaway without table numbers,
      // you might need a different endpoint to fetch the "open" order just created.
      // For now, guard and inform:
      alert('No table selected — please select a table for payment, or implement takeaway fetch here.');
      return;
    }

    const unpaidRes = await api.get(
      `${API}/orders/by-table/${encodeURIComponent(selectedTable)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const allItems = Array.isArray(unpaidRes.data) ? unpaidRes.data : [];
    const unpaid = allItems.filter(i => Number(i.paid) === 0);

    if (unpaid.length === 0) {
      alert('Nothing to pay — all items are already settled.');
      return;
    }

    const itemIds = unpaid.map(i => i.id);

    // 3) Mark them paid
    await api.post(`${API}/orders/mark-paid`, {
      tableNumber: selectedTable,
      itemIds,
      paymentMethod: selectedPaymentMethod || 'Cash',
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 4) Navigate to receipt with the data used for rendering
    navigate('/receipt', {
      state: {
        tableNumber: selectedTable,
        orderItems: unpaid,                 // what we just paid
        totalAmount: grandTotal,            // includes discount/service calc from UI
        paymentMethod: selectedPaymentMethod,
        isTakeaway: !selectedTableId,       // heuristic: if no table id, assume takeaway
      }
    });

    // 5) Reset a bit and refresh panel
    setSelectedItemsToPay([]);
    setSelectedPaymentMethod('Cash');
    setLoadedFromDB(false);
    fetchUnpaidOrders(selectedTable);
  } catch (err) {
    console.error('❌ Payment failed:', err);
    alert('Payment failed. Please try again.');
  }
};

const [showDeleteId, setShowDeleteId] = useState(null);
let holdTimer = useRef(null);

const startHoldTimer = (id) => {
  holdTimer.current = setTimeout(() => {
    setShowDeleteId(id);
  }, 2000); // 2 seconds
};

const cancelHoldTimer = () => {
  clearTimeout(holdTimer.current);
};

const getTableNumber = (label) => {
  return label.replace('Table ', '').trim();
};

const handleTransferTable = async (targetTable) => {
  if (!selectedTable || !targetTable) {
    alert("Missing source or target table.");
    return;
  }

  try {
    await api.put(`${API}/pos-orders/transfer-table`, {
      oldTable: selectedTable.toString(),
      newTable: targetTable.toString()
    });

   alert(`✅ Order moved from Table ${selectedTable} to Table ${targetTable}`);
 setSelectedTable(targetTable);
 setShowTransferMap(false);
 setLoadedFromDB(false); // force unpaid-orders fetch in your effect
 fetchOrders();          // refresh right panel
  } catch (err) {
    console.error("❌ Failed to transfer table", err);
    alert("Transfer failed.");
  }
};

// Clear all items
const handleClear = () => {
  if (!cart.length) return;
  if (!window.confirm('Clear all items?')) return;
  setCart([]);
};

// Cancel current order (same as clear for now, easy to expand later)
const handleCancel = () => {
  if (!cart.length) return;
  if (!window.confirm('Cancel this order?')) return;
  setCart([]);
};

// Save a custom/misc item
const handleMiscSave = () => {
  if (!miscName.trim()) {
    alert('Item name is required');
    return;
  }
  const price = parseFloat(miscPrice);
  if (isNaN(price) || price < 0) {
    alert('Valid price is required');
    return;
  }
  setCart(prev => [
    ...prev,
    {
      meal_id: `misc-${Date.now()}`,   // unique id
      meal_name: miscName,
      name: miscName,
      price,
      quantity: 1,
      category: 'misc',
    }
  ]);
  setShowMiscModal(false);
  setMiscName('');
  setMiscPrice('');
};

// Hold the order (stored locally; you can later add a "Held Orders" list)
const handleHold = () => {
  if (!cart.length) {
    alert('Nothing to hold.');
    return;
  }
  const key = 'held_orders';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const ticket = {
    id: Date.now(),
    table: selectedTableName || selectedTableId || null,
    items: cart,
    total: cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify([ticket, ...existing]));
  setCart([]);
  alert('Order held. You can add a “Resume Held” UI later.');
};

// Save to backend then print
const handleSaveAndPrint = async () => {
  if (!cart.length) {
    alert('Add at least one item.');
    return;
  }
  try {
    await placeOrder();      // you already have this
    setTimeout(() => handlePrint(), 200); // tiny delay so UI settles
  } catch (e) {
    console.error(e);
  }
};

// --- Held orders helpers ---
const loadHeld = () => {
  const key = 'held_orders';
  setHeldOrders(JSON.parse(localStorage.getItem(key) || '[]'));
};

useEffect(() => { loadHeld(); }, []);

const resumeHeld = (ticketId) => {
  const key = 'held_orders';
  const all = JSON.parse(localStorage.getItem(key) || '[]');
  const ticket = all.find(t => t.id === ticketId);
  if (!ticket) return;
  setCart(ticket.items || []);
  localStorage.setItem(key, JSON.stringify(all.filter(t => t.id !== ticketId)));
  loadHeld();
  setHeldOpen(false);
};

// --- Line editing ---
const changeQty = (meal_id, delta) => {
  setCart(prev => prev
    .map(i => i.meal_id === meal_id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    .filter(i => i.quantity > 0));
};

const removeLine = (meal_id) => {
  setCart(prev => prev.filter(i => i.meal_id !== meal_id));
};

// --- Totals ---
const subtotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
const discountAmount = (() => {
  const v = parseFloat(discountValue);
  if (isNaN(v) || v <= 0) return 0;
  return discountType === 'percent' ? (subtotal * v) / 100 : v;
})();
const afterDiscount = Math.max(0, subtotal - discountAmount);
const serviceAmount = serviceOn ? (afterDiscount * (serviceRate / 100)) : 0;
const grandTotal = (afterDiscount + serviceAmount);

// --- Discount modal actions ---
const applyDiscount = () => {
  const v = parseFloat(discountValue);
  if (isNaN(v) || v < 0) {
    alert('Enter a valid discount');
    return;
  }
  setShowDiscountModal(false);
};

  return (
    <>
      {/* === Main POS Layout === */}
      <div className={`pos-wrapper ${flipLayout ? 'flipped' : ''}`}>
        {/* Sidebar */}
        <aside className="pos-sidebar">

          <hr className="my-2" />
{/* Top-left micro toolbar */}
<div className="pos-topbar">
  <button
    className="icon-btn"
    title="Logout"
    onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
  >
    🚪
  </button>

  <button
    className="icon-btn"
    title="Add Category"
    onClick={() => setShowCategoryModal(true)}
  >
    ➕
  </button>
</div>

{categories.map((cat) => (
  <div
    key={cat.id}
    onMouseDown={() => startHoldTimer(cat.id)}
    onMouseUp={cancelHoldTimer}
    onMouseLeave={cancelHoldTimer}
    onTouchStart={() => startHoldTimer(cat.id)}
    onTouchEnd={cancelHoldTimer}
  >
    <CategoryTile
      icon={cat.icon}
      name={cat.name}
      active={selectedCategory === cat.name}
      onClick={() => handleCategoryClick(cat.name)}
    />
    {showDeleteId === cat.id && (
      <button
        onClick={() => handleDeleteCategory(cat.id)}
        className="ml-2 text-red-400 hover:text-red-600 text-sm"
        title="Delete Category"
      >
        ❌
      </button>
    )}
  </div>
))}

<hr className="my-2" />
<button className="nav-button" onClick={() => navigate('/orders')}>Orders</button>

<hr className="my-2" />

{showCategoryModal && (
  <div className="category-modal">
    <div className="modal-content">
      <h3>Create New Category</h3>
      <input
        type="text"
        placeholder="Name (e.g., Hot Drinks)"
        value={newCategory.name}
        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Icon (e.g., ☕)"
        value={newCategory.icon}
        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
      />
      <select
        value={newCategory.type}
        onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
      >
        <option value="meal">Meal</option>
        <option value="drink">Drink</option>
        <option value="dessert">Dessert</option>
      </select>
      <button onClick={handleAddCategory}>Save</button>
      <button onClick={() => setShowCategoryModal(false)}>Cancel</button>
    </div>
  </div>
)}
        </aside>

        {/* Middle – Items Grid */}
        <div className="item-grid">
          <div className="search-bar">
  <input
    type="text"
    placeholder="Search anything here"
    className="search-input"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>

<div className="items-scroll-wrapper">
  <div className="items-grid">
    {visibleMeals.map((meal) => (
      <ItemCard
        key={meal.id}
        meal={meal}
        onClick={(m) => { setSelectedMeal(m); setShowModal(true); }}
      />
    ))}
  </div>
</div>
        </div>

        {/* === Order Summary === */}
      {/* === Order Summary === */}
<aside className="order-summary" ref={printRef}>
  {/* Header with dine-in/takeaway badge */}
  <div className="order-header">
    <div className="order-title">Order No: 3</div>
    <div className={`order-badge ${orderType === 'dine-in' ? 'in' : 'out'}`}>
      {orderType === 'dine-in' ? 'Dine in' : 'Takeaway'}
    </div>
  </div>

  {/* Lines */}
  {cart.map((item) => (
    <OrderLine
      key={item.meal_id || item.id}
      item={item}
      onInc={() => changeQty(item.meal_id, +1)}
      onDec={() => changeQty(item.meal_id, -1)}
      onRemove={() => removeLine(item.meal_id)}
      onEdit={() => { setSelectedMeal({ ...item, id: item.meal_id }); setShowModal(true); }}
      onNote={() => {}}
      onDiscount={() => setShowDiscountModal(true)}
      onMore={() => {}}
    />
  ))}

  <hr className="my-2" />

  {/* Totals (single, consolidated block) */}
  <div className="totals text-sm">
    <div className="flex justify-between">
      <span>Net Total</span>
      <span>£{subtotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Discount</span>
      <span>£{discountAmount.toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Service Charge</span>
      <span>£{serviceAmount.toFixed(2)}</span>
    </div>
    <div className="flex justify-between font-semibold text-lg mt-1">
      <span>Total</span>
      <span>£{grandTotal.toFixed(2)}</span>
    </div>
  </div>


  {/* Core actions */}
<div className="pos-buttons">
  <button className="pos-button" onClick={() => setShowMiscModal(true)}>Misc</button>
  <button className="pos-button" onClick={() => setShowDiscountModal(true)}>Discount</button>

  <button
    className={`pos-button ${serviceOn ? 'active' : ''}`}
    onClick={() => setServiceOn(v => !v)}
  >
    {serviceOn ? 'Service: ON' : 'Service: OFF'}
  </button>

  <button className="pos-button" onClick={() => setShowSplitChooser(true)}>Split</button>
  <button className="pos-button save" onClick={() => setShowPayChooser(true)}>Pay</button>

<button className="pos-button" onClick={() => setShowOthers(true)}>Others</button>
</div>

</aside>

      </div>

      {/* === Meal Modal === */}
      {showModal && selectedMeal && (
        <MealModal
          meal={selectedMeal}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedMeal(null);
          }}
          onConfirm={handleModalConfirm}
        />
      )}

      {/* === Split Bill Modal === */}
      {showSplitModal && (
        <div className="modal-overlay">
          <div className="modal-content w-full max-w-md mx-auto bg-white p-6 rounded-xl shadow-xl z-50">
            <h2 className="text-lg font-bold mb-4 text-center">🧾 Split Bill</h2>
            {previousOrders.filter(item => item.paid === 0).map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => {
                      if (selectedItems.includes(item.id)) {
                        setSelectedItems(selectedItems.filter((id) => id !== item.id));
                      } else {
                        setSelectedItems([...selectedItems, item.id]);
                      }
                    }}
                  />
                  <span>{item.quantity} × {item.meal_name}</span>
                </label>
                <span className="font-semibold text-sm">£{parseFloat(item.total_price).toFixed(2)}</span>
                <span className="text-sm text-gray-400 ml-2">
                  {item.paid === 1 ? '✅ PAID' : ''}
                </span>
              </div>
            ))}
            <div className="mt-4">
              <button className="w-full bg-green-600 text-white py-2 rounded mb-2 font-semibold hover:bg-green-700 transition" onClick={handleSplitPay}>
                ✅ Confirm Payment
              </button>
              <button className="w-full bg-gray-400 text-white py-2 rounded font-semibold hover:bg-gray-500 transition" onClick={() => setShowSplitModal(false)}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{showMiscModal && (
  <div className="modal-overlay">
    <div className="modal-content w-full max-w-sm mx-auto bg-white p-4 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">Add Custom Item</h3>
      <label className="block text-sm mb-1">Name</label>
      <input
        className="form-input w-full mb-3"
        value={miscName}
        onChange={(e) => setMiscName(e.target.value)}
        placeholder="e.g., Service Charge"
        autoFocus
      />
      <label className="block text-sm mb-1">Price (£)</label>
      <input
        className="form-input w-full mb-4"
        value={miscPrice}
        onChange={(e) => setMiscPrice(e.target.value)}
        placeholder="e.g., 2.50"
        inputMode="decimal"
      />
      <div className="flex gap-2 justify-end">
        <button className="pos-button cancel" onClick={() => setShowMiscModal(false)}>Cancel</button>
        <button className="pos-button save" onClick={handleMiscSave}>Add</button>
      </div>
    </div>
  </div>
)}

{showDiscountModal && (
  <div className="modal-overlay">
    <div className="modal-content w-full max-w-sm mx-auto bg-white p-4 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">Apply Discount</h3>
      <div className="flex gap-2 mb-3">
        <button className={`pos-button ${discountType==='percent'?'active':''}`} onClick={() => setDiscountType('percent')}>%</button>
        <button className={`pos-button ${discountType==='amount'?'active':''}`} onClick={() => setDiscountType('amount')}>£</button>
      </div>
      <input
        className="form-input w-full mb-3"
        value={discountValue}
        onChange={(e) => setDiscountValue(e.target.value)}
        placeholder={discountType==='percent' ? 'e.g., 10' : 'e.g., 2.50'}
        inputMode="decimal"
      />
      {serviceOn && (
        <>
          <label className="block text-sm mb-1">Service %</label>
          <input
            className="form-input w-full mb-3"
            value={serviceRate}
            onChange={(e) => setServiceRate(Math.max(0, parseFloat(e.target.value) || 0))}
            inputMode="decimal"
          />
        </>
      )}
      <div className="flex gap-2 justify-end">
        <button className="pos-button cancel" onClick={() => setShowDiscountModal(false)}>Close</button>
        <button className="pos-button save" onClick={applyDiscount}>Apply</button>
      </div>
    </div>
  </div>
)}

{showPayChooser && (
  <div className="modal-overlay" onClick={() => setShowPayChooser(false)}>
    <div className="modal-content w-full max-w-xs mx-auto bg-white p-4 rounded-xl shadow"
         onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-semibold mb-4 text-center">Choose Payment</h3>
      <div className="flex gap-2">
        <button
          className={`pos-button ${selectedPaymentMethod==='Cash' ? 'active' : ''}`}
          onClick={() => { setSelectedPaymentMethod('Cash'); setShowPayChooser(false); handleCompletePayment(); }}
        >
          Cash
        </button>
        <button
          className={`pos-button ${selectedPaymentMethod==='Card' ? 'active' : ''}`}
          onClick={() => { setSelectedPaymentMethod('Card'); setShowPayChooser(false); handleCompletePayment(); }}
        >
          Card
        </button>
      </div>
      <button className="pos-button cancel mt-3 w-full" onClick={() => setShowPayChooser(false)}>Cancel</button>
    </div>
  </div>
)}

{heldOpen && (
  <div className="held-overlay" onClick={() => setHeldOpen(false)}>
    <div className="held-drawer" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Held Orders</h3>
        <button className="pos-button cancel" onClick={() => setHeldOpen(false)}>Close</button>
      </div>
      {heldOrders.length === 0 && <div className="text-sm text-gray-500">No held orders.</div>}
      {heldOrders.map(t => (
        <div key={t.id} className="held-tile">
          <div className="font-medium">#{t.id} • {t.table ?? 'No table'}</div>
          <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
          <div className="text-sm">Items: {t.items?.length || 0}</div>
          <div className="text-sm">£{(t.total || 0).toFixed(2)}</div>
          <button className="pos-button save" onClick={() => resumeHeld(t.id)}>Resume</button>
        </div>
      ))}
    </div>
  </div>
)}

      {/* === Split by People Modal === */}
      {splitByPeopleModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Split by People</h2>
            <p>Total Bill: £{totalBill.toFixed(2)}</p>
            <label>Number of People:</label>
            <input
              type="number"
              value={peopleCount}
              onChange={e => setPeopleCount(parseInt(e.target.value) || 1)}
              min="1"
            />
            <button onClick={handleSplitByPeople}>🔢 Calculate Share</button>
            {sharePerPerson > 0 && (
              <div>
                <p>Each person pays: <strong>£{sharePerPerson.toFixed(2)}</strong></p>
                <p>Next: Person {personIndex}</p>
                <button onClick={handlePayShare}>💳 Pay Person {personIndex}</button>
              </div>
            )}
            <button onClick={() => setSplitByPeopleModalOpen(false)}>❌ Close</button>
          </div>
        </div>
      )}

{showOthers && (
  <div className="held-overlay" onClick={()=>setShowOthers(false)}>
    <div className="held-drawer" onClick={(e)=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Others</h3>
        <button className="pos-button cancel" onClick={()=>setShowOthers(false)}>Close</button>
      </div>

      <div className="grid gap-2">
        <button className="pos-button" onClick={() => { setShowTransferMap(true); setShowOthers(false); }}>Transfer Table</button>
        <button className="pos-button" onClick={handleSaveAndPrint}>Save & Print</button>
        <button className="pos-button" onClick={() => { loadHeld(); setHeldOpen(true); }}>Resume Held ({heldOrders.length})</button>
        <button className="pos-button cancel" onClick={closeTable}>Close Table</button>
        <button className="pos-button" onClick={() => { setShowComplaint(true); }}>Complaints / Redo</button>
        <button className="pos-button" onClick={handleHold}>Hold Current</button>
        <button className="pos-button" onClick={handleClear}>Clear Cart</button>
        <button className="pos-button cancel" onClick={handleCancel}>Cancel Order</button>
      </div>
    </div>
  </div>
)}

{showComplaint && (
  <div className="modal-overlay">
    <div className="modal-content w-full max-w-sm mx-auto bg-white p-4 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-3">Log a Complaint</h3>

      <label className="block text-sm">Item</label>
      <input className="form-input w-full mb-2"
        value={complaint.item_name}
        onChange={e=>setComplaint({...complaint, item_name:e.target.value})}
        placeholder="Item name" />

      <label className="block text-sm">Reason</label>
      <input className="form-input w-full mb-2"
        value={complaint.reason}
        onChange={e=>setComplaint({...complaint, reason:e.target.value})}
        placeholder="e.g., overcooked" />

      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <label className="block text-sm">Qty</label>
          <input className="form-input w-full" type="number" min="1"
            value={complaint.quantity}
            onChange={e=>setComplaint({...complaint, quantity:parseInt(e.target.value)||1})} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2">
            <input type="checkbox"
              checked={complaint.redo}
              onChange={e=>setComplaint({...complaint, redo:e.target.checked})} />
            Redo (deduct stock)
          </label>
        </div>
      </div>

      <label className="block text-sm">Your name</label>
      <input className="form-input w-full mb-3"
        value={complaint.reported_by}
        onChange={e=>setComplaint({...complaint, reported_by:e.target.value})}
        placeholder="Staff name" />

      <div className="flex gap-2 justify-end">
        <button className="pos-button cancel" onClick={()=>setShowComplaint(false)}>Cancel</button>
        <button
          className="pos-button save"
          onClick={async ()=>{
            try{
              await api.post(`${API}/reports`, {
                order_id: complaint.order_id || null,
                item_name: complaint.item_name,
                reason: complaint.reason,
                reported_by: complaint.reported_by,
                quantity: complaint.quantity,
                redo: complaint.redo ? 1 : 0
              });
              alert('Complaint logged');
              setShowComplaint(false);
              setComplaint({ order_id:'', item_name:'', reason:'', reported_by:'', quantity:1, redo:false });
            }catch(e){ alert('Failed to log complaint'); }
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}


{showSplitChooser && (
  <div className="modal-overlay" onClick={() => setShowSplitChooser(false)}>
    <div className="modal-content w-full max-w-xs mx-auto bg-white p-4 rounded-xl shadow"
         onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-semibold mb-4 text-center">Split Bill</h3>
      <div className="flex gap-2">
        <button className="pos-button" onClick={() => { setShowSplitChooser(false); setShowSplitModal(true); }}>
          By Items
        </button>
        <button className="pos-button" onClick={() => { setShowSplitChooser(false); setSplitByPeopleModalOpen(true); }}>
          By People
        </button>
      </div>
      <button className="pos-button cancel mt-3 w-full" onClick={() => setShowSplitChooser(false)}>Close</button>
    </div>
  </div>
)}

{showSplitChooser && (
  <div className="modal-overlay" onClick={() => setShowSplitChooser(false)}>
    <div className="modal-content w-full max-w-xs mx-auto bg-white p-4 rounded-xl shadow"
         onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-semibold mb-4 text-center">Split Bill</h3>
      <div className="flex gap-2">
        <button className="pos-button" onClick={() => { setShowSplitChooser(false); setShowSplitModal(true); }}>
          By Items
        </button>
        <button className="pos-button" onClick={() => { setShowSplitChooser(false); setSplitByPeopleModalOpen(true); }}>
          By People
        </button>
      </div>
      <button className="pos-button cancel mt-3 w-full" onClick={() => setShowSplitChooser(false)}>Close</button>
    </div>
  </div>
)}

      {/* === Transfer Table Modal === */}
      {showTransferMap && tables && (
        <TableMapModal
          tables={tables}
          onSelect={handleTransferTable}
          onClose={() => setShowTransferMap(false)}
        />
      )}
      
    </>

  );
};

export default PosPage;
