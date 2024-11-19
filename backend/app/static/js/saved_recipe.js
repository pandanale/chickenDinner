// Recipe Deletion Functionality
window.confirmDelete = function (recipeTitle, recipeId) {
  const confirmed = confirm(`Are you sure you want to delete the recipe "${recipeTitle}"?`);
  if (confirmed) {
    deleteRecipe(recipeTitle, recipeId);
  }
};

async function deleteRecipe(recipeTitle, recipeId) {
  try {
    console.log("Deleting Recipe:", { title: recipeTitle, id: recipeId }); // Debugging
    const response = await fetch("/delete-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: recipeTitle }), // Ensure 'title' matches backend
    });

    const data = await response.json();

    if (data.success) {
      alert(`Recipe "${recipeTitle}" deleted successfully.`);
      location.reload(); // Refresh the page to reflect the updated recipe list
    } else {
      alert(`Failed to delete recipe: ${data.message}`);
    }
  } catch (error) {
    console.error("Error deleting recipe:", error);
    alert("An error occurred while deleting the recipe. Please try again.");
  }
}
