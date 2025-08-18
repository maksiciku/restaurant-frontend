import React, { useState } from "react";
import axios from "axios";

const StockForm = ({ onStockAdded }) => {
  const [ingredientName, setIngredientName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [allergens, setAllergens] = useState("");
  const [isReadyMade, setIsReadyMade] = useState(false);
  const [image, setImage] = useState(null);
  const [extractedIngredients, setExtractedIngredients] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isPrepped, setIsPrepped] = useState(false);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const scanIngredient = async () => {
    if (!image) {
      alert("Please upload an image to scan.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post("http://localhost:5000/scan-ingredient-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setExtractedIngredients(response.data.extractedIngredients);
      } else {
        alert("Failed to scan ingredient.");
      }
    } catch (error) {
      console.error("❌ Error scanning ingredient:", error);
      alert("Error scanning ingredient.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ingredientName.trim() || isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid ingredient name and quantity.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/stock",
        {
          ingredient: ingredientName,
          quantity: parseFloat(quantity),
          unit: unit.trim(),
          price: parseFloat(price),
          calories_per_100g: parseFloat(calories),
          allergens: allergens.trim() || "None",
          ...(isPrepped && expiryDate && { expiry_date: expiryDate }),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("✅ Ingredient added to stock!");
      setIngredientName("");
      setQuantity(1);
      setUnit("");
      setPrice("");
      setCalories("");
      setAllergens("");
      setImage(null);
      setExtractedIngredients("");
      setExpiryDate("");
      setIsPrepped(false);
      onStockAdded();
    } catch (error) {
      console.error("❌ Error adding stock:", error);
      alert("Error adding stock.");
    }
  };

  return (
    <div>
      <h2>📦 Add New Ingredient</h2>

      <input
        type="text"
        placeholder="Ingredient Name (e.g., Butter)"
        value={ingredientName}
        onChange={(e) => setIngredientName(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")}
        min="1"
        required
      />

      <input
        type="text"
        placeholder="Unit (e.g., g, pcs, ml)"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Price per Unit (£)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        type="number"
        placeholder="Calories per 100g"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
      />

      <input
        type="text"
        placeholder="Allergens (comma separated)"
        value={allergens}
        onChange={(e) => setAllergens(e.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={isPrepped}
          onChange={() => setIsPrepped(!isPrepped)}
        />
        {" "}Is this a prepared ingredient?
      </label>

      {isPrepped && (
        <div>
          <label>Expiry Date:</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      )}

      <label>
        Is this ingredient ready-made?
        <input
          type="checkbox"
          checked={isReadyMade}
          onChange={() => setIsReadyMade(!isReadyMade)}
        />
      </label>

      {isReadyMade && (
        <>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button type="button" onClick={scanIngredient}>📸 Scan Ingredient</button>
        </>
      )}

      {extractedIngredients && (
        <div>
          <p><strong>Extracted Ingredients:</strong> {extractedIngredients}</p>
        </div>
      )}

      <button type="submit" onClick={handleSubmit}>➕ Add to Stock</button>
    </div>
  );
};

export default StockForm;
