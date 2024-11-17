import React from "react";

const SavedRecipes = () => {
  const recipes = ["Grilled Chicken", "Veggie Stir-Fry"]; // Mock data

  return (
    <div className="saved-recipes">
      {recipes.map((recipe, index) => (
        <div key={index} className="saved-recipe">
          <p>{recipe}</p>
        </div>
      ))}
    </div>
  );
};

export default SavedRecipes;
