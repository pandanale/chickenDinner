document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatWindow = document.getElementById("chatWindow");
  const logoutButton = document.getElementById("logoutButton");
  const homeButton = document.getElementById("homeButton");
  const savedRecipesButton = document.getElementById("savedRecipesButton");
  const chatbotButton = document.getElementById("chatbotButton")

  document.getElementById('pepperButton').addEventListener('click', makePeppersFall);

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


  function makePeppersFall() {
    const container = document.getElementById('pepperContainer');
    for (let i = 0; i < 20; i++) { // Adjust the number of peppers as needed
        const pepper = document.createElement('span');
        pepper.className = 'pepper';
        pepper.textContent = '🌶️';
        pepper.style.left = Math.random() * 100 + 'vw';
        pepper.style.animationDuration = (Math.random() * 2 + 3) + 's'; // Random duration between 3s and 5s
        pepper.style.fontSize = (Math.random() * 10 + 20) + 'px'; // Random font size between 20px and 30px
        
        container.appendChild(pepper);

        // Remove the pepper after it's fallen
        setTimeout(() => {
            if (container.contains(pepper)) {
                container.removeChild(pepper);
            }
        }, 5000);
    }
}

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

 // Function to confirm deletion
function confirmDelete(recipeTitle) {
  const confirmed = confirm(`Are you sure you want to delete the recipe "${recipeTitle}"?`);
  if (confirmed) {
      deleteRecipe(recipeTitle);
  }
}

// Function to send a delete request and update the screen
async function deleteRecipe(recipeTitle) {
  try {
      const response = await fetch('/delete-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: recipeTitle })
      });

      const data = await response.json();

      if (data.success) {
          alert(`Recipe "${recipeTitle}" deleted successfully.`);
          // Remove the recipe card from the DOM
          const recipeCard = document.querySelector(`.recipe-card[data-title="${recipeTitle}"]`);
          if (recipeCard) {
              recipeCard.remove();
          }

          // Reload the page to ensure consistency
          location.reload();
      } else {
          alert(`Failed to delete recipe: ${data.message}`);
      }
  } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('An error occurred while deleting the recipe.');
  }
}


  async function saveRecipe() {
    const response = await fetch("/save-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: 'yes' }),
    });
  }

  let isImageGenerating = false; // Track whether an image is being generated

async function generateImage() {
  try {
    if (isImageGenerating) {
      displayMessage("Bot", "An image is already being generated. Please wait...");
      return;
    }

    // Set the flag to true to prevent multiple requests
    isImageGenerating = true;

    // Disable the "Generate Image" button (optional)
    const generateButton = document.querySelector('.generate-image-button');
    if (generateButton) generateButton.disabled = true;

    // Step 1: Send the initial request
    const response = await fetch("/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generate: "yes" }),
    });

    const data = await response.json();

    // Display "Generating image..." message in the chat window
    displayMessage("Bot", data.message);

    // Step 2: Poll for the generated image
    await pollForGeneratedImage();

    // Reset the flag and re-enable the button after the image is generated
    isImageGenerating = false;
    if (generateButton) generateButton.disabled = false;

  } catch (error) {
    console.error("Error generating image:", error);
    displayMessage("Bot", "An error occurred while generating the image. Please try again.");
    isImageGenerating = false; // Reset the flag in case of an error
    const generateButton = document.querySelector('.generate-image-button');
    if (generateButton) generateButton.disabled = false;
  }
}

async function pollForGeneratedImage() {
  try {
    // Wait a short time before polling
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch("/generate-image-result", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (response.ok) {
      displayMessage("Bot", data.message);
      if (data.image_url) {
        displayMessage(
          "",
          `<img src="${data.image_url}" alt="Generated Recipe Image" style="max-width: 75%; max-height: 75%; width: auto; height: auto; aspect-ratio: 1 / 1;">`
        );
      }
    } else {
      displayMessage("Bot", data.message);
    }
  } catch (error) {
    console.error("Error polling for image:", error);
    displayMessage("Bot", "An error occurred while retrieving the image.");
  }
}

function resetImageGeneration() {
  isImageGenerating = false; // Reset the frontend flag
  const generateButton = document.querySelector('.generate-image-button');
  if (generateButton) generateButton.disabled = false;
  displayMessage("Bot", "You can now generate a new image.");
}

  async function askQuestion(message) {
    const recipeContext = JSON.parse(sessionStorage.getItem("recipeContext"));
    const response = await fetch("/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message, recipe: recipeContext }),
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
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");

    // Recipe Title
    const recipeTitle = document.createElement("h2");
    recipeTitle.textContent = title;
    recipeTitle.style.textAlign = "center";
    recipeCard.appendChild(recipeTitle);

    // Ingredients Section
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

    // Instructions Section
    const instructionsSection = document.createElement("div");
    instructionsSection.innerHTML = `<strong>Instructions:</strong> <p>${instructions}</p>`;
    recipeCard.appendChild(instructionsSection);

    // Icon Container
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon-container");
    iconContainer.style.display = "flex";
    iconContainer.style.justifyContent = "center";
    iconContainer.style.gap = "20px"; // Add space between icons
    iconContainer.style.marginTop = "15px";

    // Heart Icon
    const heartIcon = document.createElement("i");
    heartIcon.className = "fa-regular fa-heart";
    heartIcon.style.cursor = "pointer";
    heartIcon.addEventListener("click", () => {
        if (heartIcon.classList.contains("fa-regular")) {
            heartIcon.classList.remove("fa-regular");
            heartIcon.classList.add("fa-solid");
            console.log("Recipe saved!");
            saveRecipe();
        } else {
            heartIcon.classList.remove("fa-solid");
            heartIcon.classList.add("fa-regular");
            console.log("Recipe unsaved!");
        }
    });
    iconContainer.appendChild(heartIcon);

    // Image Icon
    const imageIcon = document.createElement("i");
    imageIcon.className = "fa-regular fa-image";
    imageIcon.style.cursor = "pointer";
    imageIcon.addEventListener("click", () => {
        console.log("Generate Image button clicked!");
        generateImage();
    });
    iconContainer.appendChild(imageIcon);

    // Question Button
    // const askQuestionButton = document.createElement("button");
    // askQuestionButton.textContent = "Ask a Question About the Recipe";
    // askQuestionButton.classList.add("ask-question-button");
    // askQuestionButton.style.marginTop = "10px";
    const askQuestionButton = document.createElement("i");
    askQuestionButton.className = "fa-solid fa-question";
    askQuestionButton.style.cursor = "pointer";
    askQuestionButton.addEventListener("click", () => {
        toggleInput();
        sessionStorage.setItem("recipeContext", JSON.stringify({ title, ingredients, instructions }));
    });
    iconContainer.appendChild(askQuestionButton);

    // Add Question Button and Icons to Recipe Card
    recipeCard.appendChild(iconContainer);

    // Append Recipe Card to Chat Window
    chatWindow.appendChild(recipeCard);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

});
