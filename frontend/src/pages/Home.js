import React from "react";
import Chatbot from "../components/Chatbot";

const Home = () => {
  return (
    <div className="home">
      <h1>Welcome to Recipe Chatbot</h1>
      <p>Enter your ingredients and let us suggest some recipes for you!</p>
      <Chatbot />
    </div>
  );
};

export default Home;
   