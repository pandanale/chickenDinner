document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatWindow = document.getElementById("chatWindow");
  const logoutButton = document.getElementById("logoutButton");
  const homeButton = document.getElementById("homeButton");
  const savedRecipesButton = document.getElementById("savedRecipesButton");
  const chatbotButton = document.getElementById("chatbotButton")

  // Logout functionality
  logoutButton?.addEventListener("click", async function () {
    const response = await fetch("/api/logout", { method: "POST" });
    const data = await response.json();
    if (data.success) {
      sessionStorage.removeItem("authenticated");
      alert(data.message);
      window.location.href = "/login";
    }
  });

  // Handle navigation to home
  homeButton?.addEventListener("click", () => {
    window.location.href = "/";
  });

  // Handle navigation to saved recipes
  savedRecipesButton?.addEventListener("click", () => {
    window.location.href = "/saved-recipes";
  });

  chatbotButton?.addEventListener("click", () => {
    window.location.href = "/chatbot";
  });

  startChat();

  chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = userInput.value.trim();
    if (message) {
      displayMessage("You", message);
      userInput.value = "";

      const step = sessionStorage.getItem("step");
      switch (step) {
        case "ingredients":
          await getRecipeSuggestions(message);
          break;
        case "questions":
          await askQuestion(message);
          break;
        default:
          displayMessage(
            "Bot",
            "I am not sure what step we are on. Let's start over."
          );
          await startChat();
          break;
      }
    }
  });

  function toggleInput() {
    var input = document.getElementById("userInput");
    input.disabled = !input.disabled;

    var button = document.getElementById("submitButton")
    button.disabled = !button.disabled;
}

  async function startChat() {
    const response = await fetch("/start-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await handleResponse(response);
    if (data) {
      displayMessage("Bot", data.message);
      sessionStorage.setItem("step", "ingredients");
    }
  }

  async function getRecipeSuggestions(message) {
    const response = await fetch("/get-recipe-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: message, cuisine_type: "" }),
    });
    const data = await handleResponse(response);
    if (data) {
      displayMessage("Bot", data.message);
      displayRecipe(data.title, data.ingredients, data.instructions);
      console.log(data)
      initializeButton(data);
      sessionStorage.setItem("step", "questions");
    }
    toggleInput();
  }

  function initializeButton() {
    displayButtons(["Save Recipe"], handleSaveRecipeButton);
    displayButtons(["Generate Image of Recipe"], handleGenerateImageButton)
  }  

  function displayButtons(buttonTexts, clickHandler, recipeData) {
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("rightButtons");
    buttonTexts.forEach(text => {
      const button = document.createElement("button");
      button.innerText = text;
      button.addEventListener("click", clickHandler);
      buttonsContainer.appendChild(button);
    });
    chatWindow.appendChild(buttonsContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  function handleSaveRecipeButton(event) {
    const action = event.target.innerText;
    if (action === "Save Recipe") {
      saveRecipe();
    }
  }

  function handleGenerateImageButton(event) {
    const action = event.target.innerText;
    if (action === "Generate Image of Recipe") {
      generateImage();
    }
  }

  async function saveRecipe() {
    const response = await fetch("/save-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: 'yes' }),
    });
  }

  async function generateImage() {
    const response = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate: 'yes' }),
    });
    const data = await handleResponse(response);
    if (data) {
      displayMessage("Bot", data.message);
      if (data.image_url) {
        displayMessage(
          "",
          `<img src="${data.image_url}" alt="Generated Recipe Image">`
        );
      }
    }
  }

  async function askQuestion(message) {
    const response = await fetch("/ask-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });
    const data = await handleResponse(response);
    if (data) {
      displayMessage("Bot", data.response);
    }
  }

  async function handleResponse(response) {
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      displayMessage("Bot", "Sorry, something went wrong. Please try again.");
      console.error("Error:", response.statusText);
      return null;
    }
  }

  function displayMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function displayRecipe(title, ingredients, instructions) {
    // Create a recipe card container
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");

    // Add the recipe title
    const recipeTitle = document.createElement("h2");
    recipeTitle.textContent = title;
    recipeTitle.style.textAlign = "center"; // Center align the title
    recipeCard.appendChild(recipeTitle);

    // Add ingredients list
    const ingredientsSection = document.createElement("div");
    ingredientsSection.innerHTML = "<strong>Ingredients:</strong>";
    const ingredientsList = document.createElement("ul");
    ingredientsList.style.listStyleType = "none";
    ingredientsList.style.paddingLeft = "0";
    ingredients.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        ingredientsList.appendChild(listItem);
    });
    ingredientsSection.appendChild(ingredientsList);
    recipeCard.appendChild(ingredientsSection);

    // Add instructions
    const instructionsSection = document.createElement("div");
    instructionsSection.innerHTML = `<strong>Instructions:</strong> <p>${instructions}</p>`;
    recipeCard.appendChild(instructionsSection);

    // Append the recipe card to the chat window
    chatWindow.appendChild(recipeCard);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

});
