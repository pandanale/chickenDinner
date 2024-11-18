// Register user
document.getElementById('registerForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (localStorage.getItem(username)) {
        alert('Username already exists!');
        return;
    }

    localStorage.setItem(username, password);
    alert('Registration successful! You can now log in.');
    window.location.href = 'login.html';
});

// Login user
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const storedPassword = localStorage.getItem(username);
    if (storedPassword && storedPassword === password) {
        alert('Login successful!');
        sessionStorage.setItem('authenticated', 'true');
        window.location.href = 'LocalLLMChat.html';
    } else {
        alert('Invalid username or password');
    }
});

// Check authentication before accessing the chatbot
if (window.location.pathname.includes('LocalLLMChat.html') && sessionStorage.getItem('authenticated') !== 'true') {
    alert('Please log in to access the chatbot.');
    window.location.href = 'login.html';
}
