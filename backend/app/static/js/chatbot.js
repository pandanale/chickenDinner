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

  function displayButtons(buttonTexts, clickHandler) {
    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttons-wrapper");
    buttonsContainer.style.display = "flex"; // Arrange buttons in a row
    buttonsContainer.style.justifyContent = "center"; // Center-align the buttons
    buttonsContainer.style.marginTop = "20px"; // Add spacing above
  
    buttonTexts.forEach((text) => {
      const button = document.createElement("button");
      button.classList.add("tooltip-button"); // Add a class for styling
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.padding = "10px";
      button.style.border = "none";
      button.style.backgroundColor = "transparent";
      button.style.cursor = "pointer";
      button.style.margin = "0 10px"; // Add space between buttons
  
      // Add Font Awesome icon and set data-action
      const icon = document.createElement("i");
      if (text === "Save Recipe") {
        icon.className = "fa-regular fa-heart"; // Font Awesome heart icon
        button.setAttribute("data-action", "save");
        button.setAttribute("data-tooltip", "Wanna save this recipe?"); // Tooltip text
      } else if (text === "Generate Image of Recipe") {
        icon.className = "fa-regular fa-image"; // Font Awesome image icon
        button.setAttribute("data-action", "generate");
        button.setAttribute("data-tooltip", "Generate an image of this recipe"); // Tooltip text
      }
  
      // Style the icon
      icon.style.fontSize = "40px"; // Adjust size
      icon.style.color = "#0056b3"; // Adjust color
      button.appendChild(icon);
  
      // Ensure the button click triggers the clickHandler
      button.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default button behavior
        clickHandler(event); // Call the handler with the event
      });
  
      // Append the button to the container
      buttonsContainer.appendChild(button);
    });
  
    chatWindow.appendChild(buttonsContainer);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  function handleSaveRecipeButton(event) {
    const button = event.currentTarget;
    const icon = button.querySelector("i"); // Find the icon within the button
  
    // Check the current state of the icon
    if (icon.classList.contains("fa-regular")) {
      // Change to solid heart and call saveRecipe
      icon.classList.remove("fa-regular", "fa-heart");
      icon.classList.add("fa-solid", "fa-heart");
      button.setAttribute("data-tooltip", "Recipe saved");
      console.log("Save Recipe button clicked!");
      saveRecipe(); // Call the saveRecipe function here
    } else {
      // Change back to regular heart
      icon.classList.remove("fa-solid", "fa-heart");
      icon.classList.add("fa-regular", "fa-heart");
      button.setAttribute("data-tooltip", "Save this recipe");
      console.log("Unsave Recipe button clicked!");
    }
  }

  function handleGenerateImageButton(event) {
    const button = event.currentTarget; // Get the button element
    const action = button.getAttribute("data-action"); // Get the action from the data attribute
  
    if (action === "generate") {
      console.log("Generate Image button clicked!");
      generateImage(); // Call the generateImage function
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
