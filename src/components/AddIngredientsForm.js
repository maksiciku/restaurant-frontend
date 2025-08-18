import React, { useState } from "react";

const AddIngredientForm = ({ onIngredientAdded }) => {
    const [ingredient, setIngredient] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!ingredient.trim()) return;

        onIngredientAdded(ingredient);
        setIngredient("");
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Enter ingredient name"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
            />
            <button type="submit">Add Ingredient</button>
        </form>
    );
};

export default AddIngredientForm;
