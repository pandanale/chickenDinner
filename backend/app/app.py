from flask import Flask, request, jsonify, session, render_template, redirect, url_for
from flask_cors import CORS
from chatbot import get_recipe_suggestions, handle_recipe_questions, generate_recipe_image
from database import save_recipe_to_db, get_user_recipes, delete_recipe_from_db
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
    session['username'] = username 

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
    try:
        # Check if an image is already generated
        if session.get('image_generated', False):
            return jsonify({"message": "Generating image..."}), 400

        # Retrieve recipe suggestions from the session
        suggestions = session.get('suggestions')
        if not suggestions:
            return jsonify({"message": "No recipe suggestions found. Please start over."}), 400

        # Generate the image (placeholder response for initial request)
        session['image_generated'] = False  # Image generation not completed yet
        return jsonify({"message": "Generating image..."}), 200
    except Exception as e:
        print("Error generating image:", e)
        return jsonify({"message": "An error occurred. Please try again."}), 500


@app.route('/generate-image-result', methods=['GET'])
def generate_image_result():
    try:
        # Retrieve recipe suggestions from the session
        suggestions = session.get('suggestions')

        if not suggestions:
            return jsonify({"message": "No recipe suggestions found. Please start over."}), 400

        # Generate the image
        image_url = generate_recipe_image(suggestions['title'])
        if image_url:
            session['image_generated'] = True  # Mark the image as generated
            return jsonify({"message": "Image generated successfully! This is what your dish could look like.", "image_url": image_url})
        else:
            return jsonify({"message": "Failed to generate image. Please try again."}), 500
    except Exception as e:
        print("Error generating image result:", e)
        return jsonify({"message": "An error occurred while generating the image."}), 500

@app.route('/reset-image-generation', methods=['POST'])
def reset_image_generation():
    session['image_generated'] = False
    return jsonify({"message": "Image generation state has been reset. You can now generate a new image."})

@app.route('/ask-question', methods=['POST'])
def ask_question_route():
    if session.get('step') != 'questions':
        return jsonify({"message": "Please complete the previous steps first."}), 400

    data = request.json
    question = data.get('question')

    suggestions = session.get('suggestions')
    response = handle_recipe_questions(suggestions, question)
    return jsonify({"response": response})

@app.route('/delete-recipe', methods=['POST'])
def delete_recipe():
    try:
        # Log incoming request data for debugging
        print("Incoming request data:", request.json)
        print("Session data:", dict(session))  # Debug session data

        # Extract the recipe title from the request JSON
        data = request.json
        recipe_title = data.get('title')  # Extract 'title' from request body
        username = session.get('user_email')  # Get the user's email from the session

        # Log extracted values for debugging
        print("Extracted recipe_title:", recipe_title)
        print("Extracted username:", username)

        # Validate the input parameters
        if not recipe_title:
            return jsonify({'success': False, 'message': 'Invalid request: Missing recipe title'}), 400
        if not username:
            return jsonify({'success': False, 'message': 'Invalid request: Missing user email'}), 400

        # Perform the deletion using the database helper
        success = delete_recipe_from_db(username, recipe_title)
        if success:
            return jsonify({'success': True, 'message': f'Recipe "{recipe_title}" deleted successfully'})
        else:
            return jsonify({'success': False, 'message': f'Failed to delete recipe "{recipe_title}"'}), 500
    except Exception as e:
        print('Error:', e)
        return jsonify({'success': False, 'message': 'An error occurred while deleting the recipe'}), 500

@app.route('/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')
    recipe = data.get('recipe')
    if not recipe:
        return jsonify({"response": "No recipe context found to answer your question."})

    # Process the question and recipe data here
    answer = handle_recipe_questions(question, recipe)
    return jsonify({"response": answer})

if __name__ == "__main__":
    app.run(debug=True)

