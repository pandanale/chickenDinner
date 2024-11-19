document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatWindow = document.getElementById("chatWindow");
  const logoutButton = document.getElementById("logoutButton");
  const homeButton = document.getElementById("homeButton");
  const savedRecipesButton = document.getElementById("savedRecipesButton");

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

  function displayRecipe(title, ingredient, instructions) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    console.log(title)
    console.log(ingredient)
    console.log(typeof(ingredient))
    console.log(instructions)
    console.log(typeof(instructions))
    // Create HTML for Ingredients list
    let ingredientListHTML = '<ul style="list-style-type: none; padding-left: 0;">';
    ingredient.forEach(item => {
        ingredientListHTML += `<li>${item}</li>`;
    });
    ingredientListHTML += '</ul>';

    // Set innerHTML of messageElement
    messageElement.innerHTML = `<em>Title:</em> ${title}<br>
                                <em>Ingredients:</em> ${ingredientListHTML}
                                <em>Instructions:<br></em> ${instructions}`;

    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

});
