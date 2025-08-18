// src/pages/PlateCalculatorPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlateCalculatorPage.css'; // You'll create this next

const PlateCalculatorPage = () => {
  const [ingredients, setIngredients] = useState([]);
  const [mealIngredients, setMealIngredients] = useState([{ ingredient: '', grams: '' }]);
  const [calculatedCost, setCalculatedCost] = useState(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await axios.get('http://localhost:5000/stock', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIngredients(response.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...mealIngredients];
    updated[index][field] = value;
    setMealIngredients(updated);
  };

  const addIngredientRow = () => {
    setMealIngredients([...mealIngredients, { ingredient: '', grams: '' }]);
  };

  const calculateCost = () => {
    let total = 0;
    mealIngredients.forEach(item => {
      const stockItem = ingredients.find(i => i.ingredient === item.ingredient);
      if (stockItem && stockItem.calories_per_100g) {
        const costPer100g = stockItem.price_per_100g || (stockItem.price / stockItem.quantity * 100); // fallback if we store price manually later
        const grams = parseFloat(item.grams);
        if (!isNaN(grams)) {
          total += (costPer100g * grams) / 100;
        }
      }
    });
    setCalculatedCost(total.toFixed(2));
  };

  return (
    <div className="plate-calculator">
      <h1>🍽️ Plate Cost Calculator</h1>
      {mealIngredients.map((item, index) => (
        <div key={index} className="ingredient-row">
          <select
            value={item.ingredient}
            onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
          >
            <option value="">Select Ingredient</option>
            {ingredients.map(i => (
              <option key={i.id} value={i.ingredient}>{i.ingredient}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Grams"
            value={item.grams}
            onChange={(e) => handleIngredientChange(index, 'grams', e.target.value)}
          />
        </div>
      ))}

      <button onClick={addIngredientRow}>➕ Add Ingredient</button>
      <button onClick={calculateCost}>💰 Calculate Cost</button>

      {calculatedCost && (
        <div className="result">
          <h2>Total Plate Cost: £{calculatedCost}</h2>
        </div>
      )}
    </div>
  );
};

export default PlateCalculatorPage;
