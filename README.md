#### chickenDinner

# LocalLLMChat (uploaded n copied lol @ aaron)
Single HTML Page access to an OpenAI API compatible Local LLM
![local_chat](https://github.com/dmeldrum6/LocalLLMChat/assets/38048135/9b8d2ca2-afe7-4fbf-9e30-0f65ca7665d1)

I have enjoyed running local LLMs using LM Studio, but wanted a simple way to be able to access them running on one computer at home from other machines without having to put up some kind of server framework.

This is a single webpage that uses JavaScript for the interaction with the OpenAI compatible API. Just edit the file and change the IP address from "Localhost" to whatever makes sense for you.

It implements streaming replies from the API so you don't need to wait for the entire answer to be rendered. As it is meant to be run serverless it does not have a lot of native features.

Generate - Passes prompt to the API endpoint and begins displaying response. <br/>
Stop - Cancels request and clears context <br/>
Clear Context - clears context and starts a new conversation. <br/>


# UI plan (Flask application with React on the front end)

Winner Winner Chicken Dinner Kitchen Helper ChatBot

- User Interface -
  1. Standard chatbot input, with clear instructions 
  2. Saved recipes tab
  3. Recipes generated -> button for "let's see what this looks like!"
     -> use dall-E to generate an image but ONLY when user requests it (saves computation time and energy)


     
