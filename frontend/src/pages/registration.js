import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css'; // Optional: Add custom styles

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Handle form submission
  const handleRegister = (e) => {
    e.preventDefault();

    // Check if username already exists in localStorage
    if (localStorage.getItem(username)) {
      alert('Username already exists!');
      return;
    }

    // Save username and password to localStorage
    localStorage.setItem(username, password);
    alert('Registration successful! You can now login.');

    // Redirect to the login page
    navigate('/login');
  };
return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />
        
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />

        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;