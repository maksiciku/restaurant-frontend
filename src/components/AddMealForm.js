import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IngredientScanner from "../components/IngredientScanner";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AddMealForm = ({ onAddMeal }) => {
    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [ingredientName, setIngredientName] = useState('');
    const [ingredientAmount, setIngredientAmount] = useState('');
    const [price, setPrice] = useState('');
    const [allergens, setAllergens] = useState([]);
    const [calories, setCalories] = useState('');
    const [error, setError] = useState('');
    const [autocomplete, setAutocomplete] = useState([]);
    const [supplierId, setSupplierId] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
if (Array.isArray(response.data)) {
  setCategories(response.data);
} else {
  console.error("❌ Categories API did not return an array:", response.data);
  setCategories([]);
}
    } catch (error) {
      console.error("❌ Failed to load categories:", error);
    }
  };

  fetchCategories();
}, []);

    // ✅ Add Ingredient Manually
    const addIngredient = async () => {
        if (!ingredientName.trim()) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/scanned`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredientName: ingredientName.trim().toLowerCase() })
            });
    
            const data = await response.json();
    
            if (data.success) {
                setIngredients(prev => [
                    ...prev,
                    {
                        name: ingredientName.trim().toLowerCase(),
                        amount: parseFloat(ingredientAmount) || 100,
                        allergens: data.allergens || "None",
                        calories: data.calories || 0
                    }
                ]);
            } else {
                setIngredients(prev => [
                    ...prev,
                    {
                        name: ingredientName.trim().toLowerCase(),
                        amount: parseFloat(ingredientAmount) || 100,
                        allergens: "Unknown",
                        calories: 0
                    }
                ]);
            }
        } catch (error) {
            console.error("❌ Error fetching ingredient details:", error);
        }
    
        setIngredientName('');
        setIngredientAmount('');
    };          

    // ✅ Remove Ingredient
    const removeIngredient = (index) => {
        setIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleIngredientInputChange = async (e) => {
        const value = e.target.value;
        setIngredientName(value);
      
        if (value.length >= 2) {
          try {
            const response = await axios.get(`${API_BASE_URL}/stock/search?q=${value}`);
            setAutocomplete(response.data || []);
        } catch (error) {
            console.error("❌ Error fetching autocomplete suggestions:", error);
            setAutocomplete([]);
          }
        } else {
          setAutocomplete([]);
        }
      };
      
    // ✅ Scan Ingredient and Fetch Details
    const scanIngredient = async () => {
        if (!ingredientName.trim()) {
            alert("Please enter an ingredient name before scanning.");
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/scanned`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredientName: ingredientName.trim().toLowerCase() })
            });
    
            const data = await response.json();
    
            if (data.success) {
                console.log("✅ Scanned Ingredient Data:", data);
    
                setIngredients(prev => [
                    ...prev,
                    {
                        name: ingredientName.trim().toLowerCase(),
                        amount: parseFloat(ingredientAmount) || 100, // Default 100g if not entered
                        allergens: data.allergens || "None",
                        calories: data.calories || 0
                    }
                ]);
    
                setIngredientName('');
                setIngredientAmount('');
            } else {
                alert("Ingredient scan failed. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error scanning ingredient:", error);
        }
    };       

    const handleSelectSuggestion = async (suggestion) => {
        setIngredientName(suggestion);
      
        try {
            const response = await fetch(`${API_BASE_URL}/ingredients/scanned`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredientName: suggestion })
            });
      
          const data = await response.json();
      
          if (data.success) {
            setIngredients(prev => [
              ...prev,
              {
                name: suggestion,
                amount: parseFloat(ingredientAmount) || 100,
                allergens: data.allergens || "None",
                calories: data.calories || 0
              }
            ]);
          } else {
            setIngredients(prev => [
              ...prev,
              {
                name: suggestion,
                amount: parseFloat(ingredientAmount) || 100,
                allergens: "Unknown",
                calories: 0
              }
            ]);
          }
      
          setIngredientName('');
          setIngredientAmount('');
          setAutocomplete([]);
        } catch (error) {
          console.error("❌ Error scanning selected ingredient:", error);
        }
      };
      
    // ✅ Handle Meal Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!name.trim() || !ingredients.length || isNaN(price) || price <= 0) {
            alert("Please enter a valid meal name, at least one ingredient, and a price.");
            return;
        }
    
        try {
            const token = localStorage.getItem("token");
    
            if (!token) {
                alert("You must be logged in to add a meal.");
                return;
            }
    
            const response = await axios.post(`${API_BASE_URL}/meals`, {
                name,
                ingredients,
                price: parseFloat(price),
                supplierId,
                category
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.meal_id) {

                console.log("📦 Meal created with ID:", response.data.meal_id);

                const mealId = response.data.meal_id;
    
                await axios.post(`${API_BASE_URL}/meals/${mealId}/ingredients`, {
                    ingredients: ingredients.map(ing => ({
                        ingredient: ing.name,
                        quantity: ing.amount
                    }))
                });
    
                alert("Meal added successfully!");
                setName("");
                setIngredients([]);
                setPrice("");
                setSupplierId("");
                setCategory("");
                onAddMeal();
            } else {
                alert("Error adding meal.");
            }
        } catch (error) {
            console.error("❌ Error adding meal:", error);
            alert("Error adding meal. Please check your login session.");
        }
    };           

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <h3>Add a New Meal</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <input 
                type="text" 
                placeholder="Meal Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
            />

            {/* ✅ Manual Ingredient Input */}
            <div>
                <h4>Ingredients</h4>
                <input 
    type="text" 
    placeholder="Ingredient Name" 
    value={ingredientName} 
    onChange={handleIngredientInputChange}
/>
{autocomplete.length > 0 && (
  <div style={{ position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', zIndex: 10 }}>
    {autocomplete.map((suggestion, index) => (
      <div 
        key={index} 
        style={{ padding: '5px', cursor: 'pointer' }}
        onClick={() => handleSelectSuggestion(suggestion)}
      >
        {suggestion}
      </div>
    ))}
  </div>
)}
                <input 
                    type="number" 
                    placeholder="Amount (grams)" 
                    value={ingredientAmount} 
                    onChange={(e) => setIngredientAmount(e.target.value)} 
                />
                <button type="button" onClick={addIngredient}>Add Manually</button>
                <button type="button" onClick={scanIngredient}>Scan Ingredient</button>
            </div>

            {/* ✅ Display Added Ingredients */}
            <ul>
                {ingredients.map((ingredient, index) => (
                    <li key={index}>
                        {ingredient.name} - {ingredient.amount}g 
                        {ingredient.allergens ? ` - Allergens: ${ingredient.allergens}` : ''} 
                        {ingredient.calories ? ` - Calories: ${ingredient.calories}` : ''}
                        <button type="button" onClick={() => removeIngredient(index)}>Remove</button>
                    </li>
                ))}
            </ul>

            {/* ✅ Show detected allergens */}
            {allergens.length > 0 && (
                <div>
                    <h4>Detected Allergens:</h4>
                    <ul>
                        {allergens.map((allergen, index) => (
                            <li key={index}>{allergen}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ✅ Input for Calories */}
            <input 
                type="number" 
                placeholder="Calories" 
                value={calories} 
                onChange={(e) => setCalories(e.target.value)} 
            />

            {/* ✅ Input for Price */}
            <input 
                type="number" 
                placeholder="Price (£)" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
            />
            <input 
  type="text" 
  placeholder="Supplier ID" 
  value={supplierId}
  onChange={(e) => setSupplierId(e.target.value)}
/>
<select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  required
>
  <option value="">-- Select Category --</option>

  {Array.isArray(categories) &&
    categories.map((cat) => (
      <option key={cat.id} value={cat.name}>
        {cat.icon} {cat.name}
      </option>
    ))}
</select>
            <button type="submit">Add Meal</button>
        </form>
    );
};

export default AddMealForm;
