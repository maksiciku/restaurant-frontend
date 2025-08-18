import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddIngredientForm from '../components/AddIngredientsForm';
import IngredientScanner from '../components/IngredientScanner';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DrinksPage = () => {
    const [drinks, setDrinks] = useState([]);
    const [drinkOrders, setDrinkOrders] = useState([]);
    const [restockList, setRestockList] = useState([]);  // ✅ Added: Track drinks that need restocking
    const [newDrink, setNewDrink] = useState({ name: '', quantity: '', price: '', allergens: '' });
    const [drinkAnalytics, setDrinkAnalytics] = useState([]);
    const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', email: '', phone: '' });
    const [selectedSupplier, setSelectedSupplier] = useState({});
    const [restockOrders, setRestockOrders] = useState([]);
    const [manualRestock, setManualRestock] = useState({ drink_name: '', needed_quantity: 1 });
    const [suppliers, setSuppliers] = useState({});
    const payload = { ...newDrink, supplier_id: null, category: 'drinks' };

    useEffect(() => {
        fetchDrinks();
        fetchDrinkOrders();
        fetchRestockList();
        fetchDrinkAnalytics();
        fetchRestockOrders();
        fetchSuppliers();  // Fetch all suppliers
    }, []);    

    useEffect(() => {
        fetch(`${API_BASE}/suppliers`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("📦 Suppliers Loaded:", data);
            setSuppliers(data); // Ensure the state updates properly
        })
        .catch((err) => console.error("❌ Error fetching suppliers:", err));
    }, []);
    
    const fetchDrinks = async () => {
  try {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/stock`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
    const allItems = res.data;

    const drinksOnly = allItems.filter(item => item.type && item.type.toLowerCase() === 'drink');

    setDrinks(drinksOnly);
    console.log("🍹 Drinks Loaded:", drinksOnly);
  } catch (error) {
    console.error("❌ Error fetching drinks:", error);
  }
};

    // ✅ Fetch drink order history
    const fetchDrinkOrders = async () => {
        try {
            const response = await axios.get(`${API_BASE}/drinks/orders`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setDrinkOrders(response.data.orders || []);
        } catch (error) {
            console.error("❌ Error fetching drink orders:", error);
            toast.error('Error fetching drink orders.');
        }
    };    

    // ✅ Fetch drinks that need restocking
    const fetchRestockList = async () => {
        try {
            const response = await axios.get(`${API_BASE}/drinks/restock-list`, {  // ✅ FIXED: Use API_BASE_URL
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });    

            setRestockList(response.data.restockList || []);
        } catch (error) {
            console.error("❌ Error fetching restock list:", error);
            toast.error('Error fetching restock list.');
        }
    };

    // ✅ Fetch restock orders
const fetchRestockOrders = async () => {
    try {
        const response = await axios.get('http://localhost:5000/drinks/restock-orders', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        setRestockOrders(response.data || []);
    } catch (error) {
        console.error("❌ Error fetching restock orders:", error);
        toast.error('Error fetching restock orders.');
    }
};

const fetchSuppliers = async () => {
    try {
        const response = await fetch(`${API_BASE}/drinks/suppliers`, {
            headers: { 
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                "Content-Type": "application/json"  // ✅ FIXED: Added Content-Type
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log("🚀 API Response:", data);

        setSuppliers(data);
    } catch (error) {
        console.error("❌ Error fetching suppliers:", error.message);
        toast.error("Error fetching suppliers. Server might be down.");
    }
};

// ✅ Auto-place a restock order based on best supplier
const handleAutoRestock = async (drinkName, neededQuantity) => {
    try {
        await fetchSuppliers(); // ✅ Ensure latest supplier data is available

        const availableSuppliers = suppliers[drinkName] || [];
        if (availableSuppliers.length === 0) {
            toast.error("❌ No suppliers available for this drink.");
            return;
        }

        const bestSupplier = availableSuppliers[0]; // Pick best supplier

        const response = await axios.post(`${API_BASE}/drinks/auto-restock`, {
            drink_name: drinkName,
            needed_quantity: neededQuantity,
            supplier_name: bestSupplier.supplier_name,
            price: bestSupplier.price,
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success(`📦 Auto-restock placed with ${bestSupplier.supplier_name}`);
        fetchRestockOrders();
    } catch (error) {
        console.error("❌ Error placing auto-restock:", error);
        toast.error('Failed to auto-restock.');
    }
};

// ✅ Manually place a restock order with selected supplier
const handleManualRestock = async () => {
    const { drink_name, needed_quantity } = manualRestock;

    if (!drink_name || needed_quantity < 1) {
        toast.error("Drink name and quantity required!");
        return;
    }

    if (!selectedSupplier?.[drink_name]) {  // ✅ FIXED: Use optional chaining
        toast.error("Select a supplier before placing a restock order.");
        return;
    }    

    try {
        const supplier = selectedSupplier[drink_name];

        await axios.post('http://localhost:5000/drinks/restock-orders', {
            drink_name,
            needed_quantity,
            supplier_name: supplier.supplier_name,
            price: supplier.price,
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success(`📦 Manual restock order placed from ${supplier.supplier_name}`);
        fetchRestockOrders();
    } catch (error) {
        console.error("❌ Error placing manual restock:", error);
        toast.error('Failed to place manual restock.');
    }
};

    // ✅ Add a new drink
    const handleAddDrink = async () => {
        if (!newDrink.name || !newDrink.quantity || !newDrink.price) {
            toast.error("All fields are required!");
            return;
        }

        try {
            await axios.post(`${API_BASE}/drinks`, newDrink, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            toast.success('✅ Drink added successfully!');
            setNewDrink({ name: '', quantity: '', price: '', allergens: '' });
            fetchDrinks();
            fetchRestockList();  // ✅ Refresh restock list after adding a drink
        } catch (error) {
            console.error("❌ Error adding drink:", error);
            toast.error('Failed to add drink.');
        }
    };

    // ✅ Order a drink (deducts stock)
    const orderDrink = async (drink) => {
        if (drink.quantity <= 0) {
            toast.error("❌ Not enough stock to place order.");
            return;
        }
    
        try {
            const response = await axios.post(`${API_BASE}/drinks/order`, {
                drink_name: drink.name, // ✅ Removed `.trim().toLowerCase()` to ensure correct format
                quantity: 1,
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
    
            if (response.data?.success) {
                toast.success(`✅ Ordered 1x ${drink.name}`);
                fetchDrinks();
                fetchDrinkOrders();
                fetchRestockList();  // ✅ Refresh stock after ordering
            } else {
                toast.error(`❌ Order failed: ${response.data?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("❌ Order request error:", error.response?.data || error);
            toast.error(`❌ Order failed: ${error.response?.data?.error || 'Unknown error'}`);
        }
    };    

    const handleEditDrink = (drink) => {
        const updatedName = prompt("Enter new drink name:", drink.name);
        const updatedQuantity = prompt("Enter new quantity (ml):", drink.quantity);
        const updatedPrice = prompt("Enter new price (£):", drink.price);
        const updatedAllergens = prompt("Enter allergens (comma-separated):", drink.allergens || "None");
    
        if (!updatedName || !updatedQuantity || !updatedPrice) return;
    
        fetch(`${API_BASE}/drinks/${drink.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                name: updatedName,
                quantity: parseInt(updatedQuantity),
                price: parseFloat(updatedPrice),
                allergens: updatedAllergens,
            }),
        })
        .then((res) => res.json())
        .then(() => {
            toast.success("✅ Drink updated successfully!");
            fetchDrinks();  // ✅ Refresh drinks
            fetchSuppliers(); // ✅ Refresh suppliers to match new names
        })
        .catch((err) => console.error("❌ Error updating drink:", err));
    };              
    
    const handleDeleteDrink = (drinkId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this drink?");
        if (!confirmDelete) return;
    
        const token = localStorage.getItem("token"); // ✅ Get authentication token
        if (!token) {
            alert("❌ No authentication token found. Please log in again.");
            return;
        }
    
        fetch(`${API_BASE}/drinks/${drinkId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}` // ✅ Attach token for authentication
            }
        })
        .then((res) => {
            if (!res.ok) {
                return res.text().then((text) => { throw new Error(text); });
            }
            return res.json();
        })
        .then(() => {
            alert("✅ Drink deleted successfully!");
            fetchDrinks(); // ✅ Refresh drinks list
        })
        .catch((err) => console.error("❌ Error deleting drink:", err));
    };
    
    // ✅ Scan Drink Ingredients & Extract Allergens
    const handleScanDrinkIngredients = async (file) => {
        if (!file) {
            toast.error("❌ No image selected for scanning.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await axios.post('http://localhost:5000/scan/scan-ingredient-image', formData, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                toast.success(`✅ Scanned: ${response.data.ingredientName}`);
                setNewDrink(prevState => ({
                    ...prevState,
                    name: response.data.ingredientName,
                    allergens: response.data.allergens
                }));
            } else {
                toast.error("❌ Ingredient scanning failed.");
            }
        } catch (error) {
            console.error("❌ Error scanning drink ingredients:", error);
            toast.error("Error scanning drink ingredients.");
        }
    };

    const fetchDrinkAnalytics = async () => {
        try {
            const response = await axios.get('http://localhost:5000/drinks/sales-analytics', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setDrinkAnalytics(response.data.analytics || []);
        } catch (error) {
            console.error("❌ Error fetching drink analytics:", error);
            toast.error('Error fetching drink analytics.');
        }
    };

// ✅ Add Supplier
const handleAddSupplier = async () => {
    if (!newSupplier.name) {
        toast.error("Supplier name is required!");
        return;
    }

    try {
        await axios.post(`${API_BASE}/drinks/suppliers`, newSupplier, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success('✅ Supplier added successfully!');
        setNewSupplier({ name: '', contact: '', email: '', phone: '' });

        await fetchSuppliers(); // ✅ Refresh suppliers after adding
    } catch (error) {
        console.error("❌ Error adding supplier:", error);
        toast.error('Failed to add supplier.');
    }
};

// ✅ Assign Supplier to Drink
const handleAssignSupplier = async () => {
    if (!selectedSupplier.drink_id || !selectedSupplier.supplier_id) {
        toast.error("Select both a drink and a supplier!");
        return;
    }

    try {
        await axios.put('http://localhost:5000/drinks/assign-supplier', selectedSupplier, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success('✅ Supplier assigned successfully!');
        fetchDrinks(); // Refresh drinks data
    } catch (error) {
        console.error("❌ Error assigning supplier:", error);
        toast.error('Failed to assign supplier.');
    }
};

// ✅ Generate Restock Orders
const handleGenerateRestockOrders = async () => {
    try {
        const response = await axios.post('http://localhost:5000/drinks/generate-restock-order', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        toast.success(response.data.message);
        fetchRestockOrders();
    } catch (error) {
        console.error("❌ Error generating restock orders:", error);
        toast.error('Failed to generate restock orders.');
    }
};

    return (
        <div className="page-card">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1>Drinks Management</h1>
    
            {/* ✅ Display restock list with better formatting */}
            {restockList.length > 0 && (
                <div>
                    <h3>⚠️ Drinks Needing Restock</h3>
                    <ul>
                        {restockList.map((drink, index) => (
                            <li key={index} style={{ color: 'red', fontWeight: 'bold' }}>
                                {drink} (Restock Needed)
                            </li>
                        ))}
                    </ul>
                </div>
            )}
    
     {/* ✅ Scan Drink Ingredients */}
     <div>
                <h3>Scan Drink Ingredients</h3>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleScanDrinkIngredients(e.target.files[0])}
                />
            </div>

            {/* ✅ Add new drinks */}
            <div style={{ marginBottom: '10px' }}>
                <input
                    type="text"
                    placeholder="Drink Name"
                    value={newDrink.name}
                    onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Quantity (ml)"
                    value={newDrink.quantity}
                    onChange={(e) => setNewDrink({ ...newDrink, quantity: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Price (£)"
                    value={newDrink.price}
                    onChange={(e) => setNewDrink({ ...newDrink, price: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Allergens (comma-separated)"
                    value={newDrink.allergens}
                    onChange={(e) => setNewDrink({ ...newDrink, allergens: e.target.value })}
                />
                <button onClick={handleAddDrink}>Add Drink</button>
            </div>
    
    {/* ✅ Supplier Management */}
<h2>📦 Supplier Management</h2>
<div>
    <h3>Add New Supplier</h3>
    <input type="text" placeholder="Supplier Name" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
    <input type="text" placeholder="Contact Person" value={newSupplier.contact} onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })} />
    <input type="email" placeholder="Email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
    <input type="tel" placeholder="Phone" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
    <button onClick={handleAddSupplier}>Add Supplier</button>
    <button onClick={() => window.location.href = '/suppliers'} style={{ margin: '10px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
    📦 View Suppliers
</button>
</div>

<h2>Manual Restock</h2>
<div>
<input
    type="text"
    placeholder="Drink Name"
    value={manualRestock.drink_name}
    onChange={(e) => {
        console.log("🛠 Updating Manual Restock Drink Name:", e.target.value); // Debugging
        setManualRestock({ ...manualRestock, drink_name: e.target.value.trim() });
    }}
/>
    <input
        type="number"
        placeholder="Quantity"
        value={manualRestock.needed_quantity}
        onChange={(e) => setManualRestock({ ...manualRestock, needed_quantity: parseInt(e.target.value) })}
    />
    <select
    value={selectedSupplier[manualRestock.drink_name]?.supplier_name || ""}
    onChange={(e) => {
        const selected = suppliers?.find(supplier => supplier.supplier_name === e.target.value);
        if (selected) {
            setSelectedSupplier(prev => ({
                ...prev,
                [manualRestock.drink_name]: selected
            }));
        }
    }}
>
    <option value="">Select Supplier</option>
    {Array.isArray(suppliers) && suppliers.length > 0 ? (
        suppliers.map((supplier, index) => (
            <option key={index} value={supplier.supplier_name}>
                {supplier.supplier_name} (£{supplier.price}/unit)
            </option>
        ))
    ) : (
        <option disabled>No suppliers available</option>
    )}
</select>
</div>

{/* ✅ Disable Button if No Supplier Selected */}
<button 
    onClick={handleManualRestock} 
    disabled={!selectedSupplier[manualRestock.drink_name]}
>
    Place Restock Order
</button>

            {/* ✅ Drinks Table */}
            <h2>Available Drinks</h2>
            {drinks.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Quantity (ml)</th>
                            <th>Price (£)</th>
                            <th>Allergens</th>
                            <th>Actions</th>
                            <th>Best Supplier</th>
                        </tr>
                    </thead>
                    <tbody>
    {drinks.map((drink) => (
        <tr key={drink.id}>
            <td>{drink.ingredient}</td>
            <td>
                {drink.quantity} ml{" "}
                {drink.quantity < 10 && <span style={{ color: 'red' }}>⚠️ Low Stock</span>}
            </td>
            <td>£{drink.price}</td>
            <td>{drink.allergens || "None"}</td>
            <td>
                <button onClick={() => orderDrink(drink)} disabled={drink.quantity <= 0}>
                    Order Drink
                </button>
                <button 
                   onClick={handleManualRestock} 
                   disabled={!selectedSupplier[manualRestock.drink_name] || !manualRestock.drink_name}
            >
                   Place Restock Order
                </button>
                {drink.quantity <= 5 && (  // ✅ Only show Auto Restock if low stock
                    <button onClick={() => handleAutoRestock(drink.name, 10)}>
                        Auto Restock
                    </button>               
                )}
                <button onClick={() => handleEditDrink(drink)}>✏️ Edit</button>
                <button onClick={() => handleDeleteDrink(drink.id)}>🗑 Delete</button>
            </td>
            <td>
               {suppliers[drink.name] && Array.isArray(suppliers[drink.name]) && suppliers[drink.name].length > 0 ? (
                   <>
                     <b>{suppliers[drink.name][0].supplier_name}</b> (£{suppliers[drink.name][0].price}/unit)
                   </>
               ) : (
                   <span style={{ color: 'gray' }}>No supplier available</span>
               )}
            </td>
        </tr>
    ))}
</tbody>
                </table>
            ) : (
                <p>No drinks available.</p>
            )}
    
    <h2>📦 Restock Orders</h2>
{restockOrders.length > 0 ? (
    <table>
        <thead>
            <tr>
                <th>Drink Name</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Total Cost (£)</th>
                <th>Next Delivery</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {restockOrders.map((order, index) => (
                <tr key={index}>
                    <td>{order.drink_name}</td>
                    <td>{order.supplier_name || "❌ No Supplier"}</td>
                    <td>{order.quantity}</td>
                    <td>£{order.total_cost && !isNaN(order.total_cost) ? order.total_cost.toFixed(2) : "0.00"}</td>
                    <td>
                      {order.deliveryDays && order.deliveryDays.length > 0
                          ? order.deliveryDays.join(", ")
                          : "📦 Awaiting Supplier Scheduling"}
                    </td>
                    <td style={{ fontWeight: "bold", color: order.status === "Pending" ? "red" : "green" }}>
                        {order.status}
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
) : <p>No restock orders yet.</p>}

            {/* ✅ Drink Sales Analytics Section */}
            <h2>📊 Drink Sales Analytics</h2>
            {drinkAnalytics.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Drink Name</th>
                            <th>Total Orders</th>
                            <th>Total Sold</th>
                            <th>Total Revenue (£)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drinkAnalytics.map((drink, index) => (
                            <tr key={index}>
                                <td>{drink.drink_name}</td>
                                <td>{drink.total_orders}</td>
                                <td>{drink.total_sold} ml</td>
                                <td>£{(drink.total_revenue || 0).toFixed(2)}</td>
                                </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No drink sales data available.</p>
            )}
        </div>
    );
};

    export default DrinksPage;