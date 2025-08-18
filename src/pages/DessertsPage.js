import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DessertsPage = () => {
  const [desserts, setDesserts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    ingredients: [],
    newIngredient: '',
    newAmount: ''
  });

  const fetchDesserts = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/meals?category=desserts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDesserts(res.data);
    } catch (err) {
      console.error("❌ Failed to load desserts:", err.message);
    }
  };

  useEffect(() => {
    fetchDesserts();
  }, []);

  const handleAddIngredient = () => {
    const { newIngredient, newAmount } = formData;
    if (!newIngredient || !newAmount) return;
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: newIngredient.trim(), amount: parseFloat(newAmount) }],
      newIngredient: '',
      newAmount: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: formData.name.trim(),
        ingredients: formData.ingredients,
        price: parseFloat(formData.price),
        category: 'desserts',
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/meals`, body, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      alert('✅ Dessert added!');
      setFormData({ name: '', price: '', ingredients: [], newIngredient: '', newAmount: '' });
      fetchDesserts();
    } catch (error) {
      console.error("❌ Failed to add dessert:", error.message);
      alert('Failed to add dessert');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🍰 Desserts</h1>

      {/* Add Dessert Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">➕ Add New Dessert</h2>

        <input
          className="border p-2 rounded mb-2 w-full"
          type="text"
          placeholder="Dessert Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <input
          className="border p-2 rounded mb-2 w-full"
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />

        <div className="flex gap-2 mb-2">
          <input
            className="border p-2 rounded w-1/2"
            type="text"
            placeholder="Ingredient"
            value={formData.newIngredient}
            onChange={(e) => setFormData({ ...formData, newIngredient: e.target.value })}
          />
          <input
            className="border p-2 rounded w-1/4"
            type="number"
            placeholder="Amount (g)"
            value={formData.newAmount}
            onChange={(e) => setFormData({ ...formData, newAmount: e.target.value })}
          />
          <button
            type="button"
            onClick={handleAddIngredient}
            className="bg-blue-500 text-white px-4 rounded"
          >
            Add
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Ingredients: {formData.ingredients.map(i => `${i.name} (${i.amount}g)`).join(', ')}
        </div>

        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">
          ✅ Save Dessert
        </button>
      </form>

      {/* Existing Desserts */}
      <div>
        <h2 className="text-lg font-semibold mb-2">📋 Existing Desserts</h2>
        <ul>
          {desserts.map((d) => (
            <li key={d.id} className="border p-2 mb-2 rounded">
              <strong>{d.name}</strong> – £{d.price.toFixed(2)} <br />
              Calories: {d.calories?.toFixed(1) || 'N/A'} kcal <br />
              Allergens: {d.allergens || 'None'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DessertsPage;
