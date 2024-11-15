// DEFAULT FROM CHAT BUT IM GONNA WORK ON IT

import React, { useState } from 'react';
import { getRecipeSuggestions } from '../services/api';

const Chatbot = () => {
    const [ingredients, setIngredients] = useState('');
    const [cuisineType, setCuisineType] = useState('');
    const [recipes, setRecipes] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await getRecipeSuggestions(ingredients.split(','), cuisineType);
        if (response.error) {
            console.error(response.error);
        } else {
            setRecipes(response.recipes.split('\n\n')); // Split recipes into an array
        }
    };

    return (
        <div className="chatbot">
            <h2>Recipe Chatbot</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Ingredients (comma-separated):
                    <input
                        type="text"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g., chicken, rice, broccoli"
                    />
                </label>
                <label>
                    Cuisine Type:
                    <input
                        type="text"
                        value={cuisineType}
                        onChange={(e) => setCuisineType(e.target.value)}
                        placeholder="e.g., Italian, healthy"
                    />
                </label>
                <button type="submit">Get Recipes</button>
            </form>
            <div className="recipes">
                {recipes.map((recipe, index) => (
                    <div key={index}>
                        <p>{recipe}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Chatbot;
