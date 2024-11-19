from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
from chatbot import get_recipe_suggestions, handle_recipe_questions, generate_recipe_image
from database import save_recipe_to_db, get_user_recipes
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# Dummy user database (for demonstration purposes)
users_db = {}

# Route for home page
@app.route('/')
def home():
    return render_template('home.html')

# Route for registration page
@app.route('/register')
def register():
    return render_template('register.html')

# Route for login page
@app.route('/login')
def login():
    return render_template('login.html')

# Register user API
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required"}), 400

    if users_db.get(username):
        return jsonify({"success": False, "message": "Username already exists"}), 409

    users_db[username] = password
    return jsonify({"success": True, "message": "Registration successful!"})

# Login user API
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required"}), 400

    stored_password = users_db.get(username)
    if stored_password and stored_password == password:
        session['user_email'] = username
        return jsonify({"success": True, "message": "Login successful!"})

    return jsonify({"success": False, "message": "Invalid username or password"}), 401

# Logout API
@app.route('/api/logout', methods=['POST'])
def logout_user():
    session.pop('user_email', None)
    return jsonify({"success": True, "message": "Logged out successfully"})

# Chatbot route
@app.route('/chatbot')
def chatbot():
    if 'user_email' not in session:
        return redirect(url_for('login'))
    return render_template('chatbot.html')

@app.route('/start-chat', methods=['POST'])
def start_chat():
    session['step'] = 'ingredients'
    return jsonify({"message": "Welcome to the ScrappyAI! Tell me what ingredients you have and what type of dish you'd like to make."})

@app.route('/get-recipe-suggestions', methods=['POST'])
def get_recipe_suggestions_route():
    if session.get('step') != 'ingredients':
        return jsonify({"message": "Please provide ingredients first."}), 400
    
    data = request.json
    ingredients = data.get('ingredients')
    cuisine_type = data.get('cuisine_type')

    # Get recipe suggestions
    suggestions = get_recipe_suggestions(ingredients, cuisine_type)
    session['suggestions'] = suggestions
    session['step'] = 'save_recipe'

    # Return the recipe and ask if the user wants to save it
    return jsonify({
        "message": "Here’s what I came up with.\n",
        "title": suggestions['title'],
        "ingredients": suggestions['ingredients'],
        "instructions": suggestions['instructions']
    })


# Route to save a recipe
@app.route('/save-recipe', methods=['POST'])
def save_recipe_route():
    if session.get('step') != 'save_recipe':
        return jsonify({"message": "You need to view the recipe suggestions first."}), 400

    data = request.json
    save = data.get('save')

    if save and save.lower() == "yes":
        suggestions = session.get('suggestions')
        email = session.get('user_email')

        if suggestions and email:
            # Save the recipe to the database
            save_recipe_to_db(
                username=email,
                title=suggestions['title'],
                ingredients=', '.join(suggestions['ingredients']),
                instructions=suggestions['instructions']
            )
            session['step'] = 'generate_image'
            return jsonify({"message": "Recipe saved successfully! Would you like to generate an image of this recipe?"})
    
    session['step'] = 'generate_image'
    return jsonify({"message": "Would you like to generate an image of this recipe?"})

@app.route('/saved-recipes')
def saved_recipes():
    if 'user_email' not in session:
        return redirect(url_for('login'))

    email = session.get('user_email')
    recipes = get_user_recipes(email)
    return render_template('saved_recipes.html', recipes=recipes)



@app.route('/generate-image', methods=['POST'])
def generate_image_route():
    # Retrieve the data from the request
    data = request.json
    generate = data.get('generate')

    # Check if the user wants to generate an image
    if generate and generate.lower() == "yes":
        # Retrieve recipe suggestions from the session
        suggestions = session.get('suggestions')
        
        if not suggestions:
            return jsonify({"message": "No recipe suggestions found. Please start over."}), 400
        
        # Generate the image
        image_url = generate_recipe_image(suggestions['title'])
        
        if image_url:
            session['step'] = 'questions'
            return jsonify({"message": "Image generated successfully! You can now ask questions about the recipe.", "image_url": image_url})
        else:
            return jsonify({"message": "Failed to generate image. Please try again."}), 500

    # If user does not want to generate an image
    session['step'] = 'questions'
    return jsonify({"message": "Okay, you can now ask questions about the recipe or let me know if you need anything else."})



@app.route('/ask-question', methods=['POST'])
def ask_question_route():
    if session.get('step') != 'questions':
        return jsonify({"message": "Please complete the previous steps first."}), 400

    data = request.json
    question = data.get('question')

    suggestions = session.get('suggestions')
    response = handle_recipe_questions(suggestions, question)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)

