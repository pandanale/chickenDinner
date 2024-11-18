//Register User
document
  .getElementById("registerForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      window.location.href = "/login";
    } else {
      alert(data.message);
    }
  });

// Login user
document
  .getElementById("loginForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      sessionStorage.setItem("authenticated", "true");
      window.location.href = "/chatbot";
    } else {
      alert(data.message);
    }
  });

// Check authentication before accessing the chatbot
if (
  window.location.pathname.includes("chatbot.html") &&
  sessionStorage.getItem("authenticated") !== "true"
) {
  alert("Please log in to access the chatbot.");
  window.location.href = "/login";
}
