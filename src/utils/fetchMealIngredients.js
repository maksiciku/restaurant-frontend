import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function fetchMealIngredients(mealName) {
  try {
    const res = await axios.get(`${API_BASE}/meals/${mealName}/ingredients`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log("✅ Ingredient response for:", mealName, res.data);

    return res.data.ingredients || []; // <- safely access the right key
  } catch (err) {
    console.error(`❌ Could not fetch ingredients for "${mealName}"`, err);
    return [];
  }
}