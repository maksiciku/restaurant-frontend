import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StockForm from "../components/StockForm";  // ✅ Import StockForm
import './StockPage.css';
import novaKnowledge from '../utils/novaKnowledge'; // Adjust path if needed

const API_BASE_URL = process.env.REACT_APP_API_URL;

const StockPage = () => {
    const [stock, setStock] = useState([]);
    const [editingStock, setEditingStock] = useState(null);
    const [newQuantity, setNewQuantity] = useState({});
    const [expiringSoon, setExpiringSoon] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const token = localStorage.getItem('token');
    const [cheapestSupplier, setCheapestSupplier] = useState(null);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    useEffect(() => {
        fetchStock();
        fetchExpiringSoon();
    }, []); 

    useEffect(() => {
      if (selectedIngredient) {
        fetchCheapestSupplier(selectedIngredient.name);
      }
    }, [selectedIngredient]);
    
    const fetchStock = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/stock`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStock(response.data);
        } catch (error) {
            toast.error('❌ Error fetching stock.');
        }
    };

    const handleAddStock = async (newStockItem) => {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/stock`, newStockItem, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success('✅ Stock added successfully!');
            fetchStock();
        } catch (error) {
            toast.error('❌ Error adding stock.');
        }
    };

    const handleUpdateStock = async (id) => {
        const updated = newQuantity[id];
    
        if (!updated || isNaN(updated.quantity) || updated.quantity <= 0 || isNaN(updated.calories)) {
            toast.error("⚠️ Please enter valid data.");
            return;
        }
    
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/stock/${id}`,
                {
                    ...(updated.ingredient !== undefined && { ingredient: updated.ingredient }),
                    ...(updated.quantity !== undefined && { quantity: parseFloat(updated.quantity) }),
                    ...(updated.allergens !== undefined && { allergens: updated.allergens }),
                    ...(updated.calories !== undefined && { calories_per_100g: parseFloat(updated.calories) }),
                    ...(updated.price !== undefined && { price: parseFloat(updated.price) }),
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
    
            const updatedFields = Object.keys(updated).filter(key => updated[key] !== undefined);
            toast.success(`✅ Updated: ${updatedFields.join(', ')}`);
    
            setEditingStock(null);
            fetchStock();
        } catch (error) {
            toast.error("❌ Error updating stock.");
        }
    };              

    const handleDeleteStock = async (id) => {
        try {
          await axios.delete(`${process.env.REACT_APP_API_URL}/stock/${id}`, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success('🗑️ Stock deleted successfully!');
            fetchStock();
        } catch (error) {
            toast.error('❌ Error deleting stock.');
        }
    };

    const handleDeleteAllExpired = async () => {
        try {
            const confirmed = window.confirm("Delete ALL expired stock?");
            if (!confirmed) return;

            const res = await axios.delete(`${process.env.REACT_APP_API_URL}/stock/expired`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success(res.data.message);
            fetchStock();
        } catch (error) {
            toast.error("❌ Error deleting expired stock.");
        }
    };

    const handleDeleteOneExpired = async (id) => {
        try {
            const confirmed = window.confirm("Delete this expired item?");
            if (!confirmed) return;

            const res = await axios.delete(`${process.env.REACT_APP_API_URL}/stock/expired/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success(res.data.message);
            fetchStock();
        } catch (error) {
            toast.error("❌ Error deleting item.");
        }
    };

    const fetchExpiringSoon = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/stock`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setExpiringSoon(response.data);
        } catch (error) {
            console.error("Error fetching expiring stock.");
        }
    };

    const updatePrice = (id, newPrice) => {
        axios.put(`/stock/${id}`, { price: parseFloat(newPrice) }, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          toast.success("Price updated!");
          fetchStock(); // Refresh the list if needed
        })
        .catch(() => toast.error("Failed to update price"));
      };
      
      const fetchCheapestSupplier = async (ingredientName) => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/supplier-prices/cheapest/${ingredientName}`);
          setCheapestSupplier({ ...res.data, ingredient: ingredientName });
        } catch (err) {
          console.error('Error fetching cheapest supplier:', err.message);
        }
      };      

    return (
        <div className="content">
            <div className="page-card">        
                <ToastContainer />
                <h1>📦 Stock Management</h1>

                <StockForm onStockAdded={fetchStock} />

                <button
                    onClick={handleDeleteAllExpired}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                    🧼 Delete All Expired Stock
                </button>

                <h2>📋 Current Stock</h2>
                <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 p-2 border rounded w-full max-w-sm"
                />

                {stock.length === 0 ? <p>No stock available.</p> : (
                    <div style={{ overflowX: "auto" }}>  
                        <table>
                        <thead>
  <tr>
    <th>Ingredient</th> {/* ADD this back! */}
    <th>Quantity</th>
    <th>Actions</th>
    <th>Allergens</th>
    <th>Calories</th>
    <th>Price per Unit (£)</th>
    <th>Expiry Date</th>
    <th>Manage</th>
  </tr>
</thead>
                            <tbody>
  {stock
    .filter((item) =>
      item.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((item) => (
        <tr key={item.id}>
        {/* INGREDIENT */}
        <td>
          {editingStock === item.id ? (
            <input
              type="text"
              value={newQuantity[item.id]?.ingredient || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    ingredient: e.target.value,
                  },
                })
              }
              placeholder="Ingredient"
            />
          ) : (
            item.ingredient
          )}
        </td>
      
        <td>
  <button
    className="text-blue-700 underline"
    onClick={() => {
      setSelectedIngredient(item); // trigger useEffect
      fetchCheapestSupplier(item.ingredient);
    }}
  >
    {item.ingredient}
  </button>
  {cheapestSupplier?.ingredient === item.ingredient && (
    <div className="bg-green-100 text-green-800 p-1 rounded mt-1 text-xs">
      🛒 Cheapest: <strong>{cheapestSupplier.cheapest_supplier}</strong> (£{cheapestSupplier.price}/unit)
    </div>
  )}
</td>

        {/* QUANTITY */}
        <td>
          {editingStock === item.id ? (
            <input
              type="number"
              value={newQuantity[item.id]?.quantity || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    quantity: e.target.value,
                  },
                })
              }
              placeholder="Quantity"
            />
          ) : (
            item.quantity
          )}
        </td>
      
        {/* ACTIONS */}
        <td>
          {item.allergens || "None"}
        </td>
      
        {/* ALLERGENS */}
        <td>
          {editingStock === item.id ? (
            <input
              type="text"
              value={newQuantity[item.id]?.allergens || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    allergens: e.target.value,
                  },
                })
              }
              placeholder="Allergens"
            />
          ) : (
            item.allergens || "None"
          )}
        </td>
      
        {/* CALORIES */}
        <td>
          {editingStock === item.id ? (
            <input
              type="number"
              value={newQuantity[item.id]?.calories || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    calories: e.target.value,
                  },
                })
              }
              placeholder="Calories per 100g"
            />
          ) : (
            item.calories_per_100g || "N/A"
          )}
        </td>
      
        {/* PRICE PER UNIT */}
        <td>
          {editingStock === item.id ? (
            <input
              type="number"
              value={newQuantity[item.id]?.price || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    price: e.target.value,
                  },
                })
              }
              placeholder="Price per Unit (£)"
            />
          ) : (
            item.price ? `£${parseFloat(item.price).toFixed(2)}` : "N/A"
          )}
        </td>
      
        {/* EXPIRY DATE */}
        <td>
          {editingStock === item.id ? (
            <input
              type="date"
              value={newQuantity[item.id]?.expiry_date || ""}
              onChange={(e) =>
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ...newQuantity[item.id],
                    expiry_date: e.target.value,
                  },
                })
              }
            />
          ) : (
            item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "—"
          )}
        </td>
      
        {/* MANAGE */}
        <td>
          {editingStock === item.id ? (
            <>
              <button onClick={() => handleUpdateStock(item.id)}>Save</button>
              <button
  onClick={() => {
    setEditingStock(null);
    setNewQuantity((prev) => {
      const updated = { ...prev };
      delete updated[item.id];
      return updated;
    });
  }}
>
  Cancel
</button>
           </>
          ) : (
            <button
              onClick={() => {
                setEditingStock(item.id);
                setNewQuantity({
                  ...newQuantity,
                  [item.id]: {
                    ingredient: item.ingredient || "",
                    quantity: item.quantity,
                    allergens: item.allergens || "",
                    calories: item.calories_per_100g || 0,
                    price: item.price || 0,
                    expiry_date: item.expiry_date
                      ? new Date(item.expiry_date).toISOString().substr(0, 10)
                      : "",
                  },
                });
              }}
            >
              Edit
            </button>
          )}
          <button onClick={() => handleDeleteStock(item.id)}>Delete</button>
          {item.expiry_date && new Date(item.expiry_date) < new Date() && (
            <button onClick={() => handleDeleteOneExpired(item.id)}>
              🗑️ Remove Expired
            </button>
          )}
        </td>
      </tr>      
    ))}
</tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockPage;
