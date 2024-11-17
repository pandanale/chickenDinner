from openai import OpenAI
import sqlite3
import os
import re
import requests

# Set your OpenAI API key
client = OpenAI(
    api_key=""
)

# File to store authorized emails
AUTH_EMAILS_FILE = "authorized_emails.txt"

# Load authorized emails from a file
def load_authorized_emails():
    if os.path.exists(AUTH_EMAILS_FILE):
        with open(AUTH_EMAILS_FILE, 'r') as f:
            return [line.strip() for line in f.readlines()]
    else:
        return []

# Save a new authorized email to the file
def save_authorized_email(email):
    with open(AUTH_EMAILS_FILE, 'a') as f:
        f.write(email + '\n')

# Function to authenticate the user by email
def authenticate_user():
    authorized_emails = load_authorized_emails()
    email = input("Please enter your email to access the Recipe Chatbot: ").strip()
    
    if email in authorized_emails:
        print("Authentication successful. Welcome!")
        return email
    else:
        print("This email is not registered.")
        create_account = input("Would you like to create an account? (yes/no): ").lower()
        if create_account == "yes":
            save_authorized_email(email)
            print("Account created and email authorized. Welcome!")
            return email
        else:
            print("Access denied.")
            return None

# Function to create a unique database file path based on user email
def get_database_path(email):
    # Convert email to a safe filename
    safe_email = re.sub(r'[^a-zA-Z0-9]', '_', email)  # Replace non-alphanumeric characters with underscores
    return f"user_recipes/{safe_email}_recipes.db"

# Initialize and connect to the user's personalized SQLite database
def initialize_user_database(email):
    db_path = get_database_path(email)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            ingredients TEXT,
            cuisine_type TEXT,
            recipe TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

# Save a recipe to the database if it doesn't already exist
def save_recipe_to_db(conn, title, ingredients, cuisine_type, recipe):
    cursor = conn.cursor()
    
    # Check if the recipe already exists
    cursor.execute('''
        SELECT id FROM recipes WHERE ingredients = ? AND cuisine_type = ? AND recipe = ?
    ''', (', '.join(ingredients), cuisine_type, recipe))
    existing_recipe = cursor.fetchone()

    if existing_recipe:
        print("This recipe already exists in the database.")
    else:
        # Save the new recipe
        cursor.execute('''
            INSERT INTO recipes (title, ingredients, cuisine_type, recipe)
            VALUES (?, ?, ?, ?)
        ''', (title, ', '.join(ingredients), cuisine_type, recipe))
        conn.commit()
        print("Recipe saved to the database.")

# Few-shot examples
few_shot_examples = [
    {
        "role": "user",
        "content": """
        I have the following ingredients: chicken, rice, and broccoli.
        I want to make a healthy dinner.
        """
    },
    {
        "role": "assistant",
        "content": """
        Here's a recipe you can make:
        ### Grilled Chicken with Broccoli and Rice
        - Ingredients:
          - Chicken breast
          - Cooked rice
          - Steamed broccoli
          - Olive oil, garlic, salt, and pepper
        - Instructions:
          1. Season the chicken with garlic, salt, and pepper.
          2. Grill the chicken until fully cooked (about 6-8 minutes per side).
          3. Steam the broccoli until tender.
          4. Serve the chicken on a bed of rice with broccoli on the side.
        
        Additional suggestion: Add soy sauce or lemon juice for extra flavor.
        """
    }
]

# Function to interact with GPT-4 using few-shot prompting
def get_recipe_suggestions(ingredients, cuisine_type):
    user_prompt = f"""
    I have the following ingredients: {', '.join(ingredients)}. 
    I want to make a dish that is {cuisine_type}.
    """
    messages = [
        {"role": "system", "content": "You are a helpful recipe assistant. Make sure the recipe title starts with ###"},
        *few_shot_examples,
        {"role": "user", "content": user_prompt}
    ]
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7,
        max_tokens=300,
    )
    return response.choices[0].message.content

def get_title(recipe_description):
    # Find the first line that starts with ###
    lines = recipe_description.split('\n')
    title = next((line for line in lines if line.startswith('###')), None)
    return title


# Function to generate an image of the recipe
def generate_recipe_image(title):
    prompt = f"Photorealistic image of a dish: {title}. Present it in a modern, well-lit setting."
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        
        # Download and save the image locally
        image_data = requests.get(image_url).content
        with open("recipe_image.png", "wb") as f:
            f.write(image_data)
        print("Image generated and saved as recipe_image.png.")
    except Exception as e:
        print(f"Error generating image: {e}")

def display_recipe_db(conn):
    cursor = conn.cursor()

    # Query to get id, title, and timestamp
    query = "SELECT id, title, timestamp FROM recipes"

    # Execute the query
    cursor.execute(query)

    # Fetch all results
    rows = cursor.fetchall()

    # Print the results
    for row in rows:
        print(f"ID: {row[0]}, Title: {row[1]}, Timestamp: {row[2]}")
    recipe_selection = input("Select recipe by ID number: ")
    cursor.execute('''
                SELECT recipe FROM recipes WHERE id = ?
                   ''', (', '.join(recipe_selection)))
    recipe = cursor.fetchone()
    print(recipe[0])

def start():
    # Authenticate the user
    email = authenticate_user()
    if not email:
        return  # Exit if authentication fails
    
    print("Welcome to the Recipe Chatbot! 🎉")
    # Initialize the personalized database connection for the user
    conn = initialize_user_database(email)
    create_or_browse = input("Would you like to create a new recipe or browse your saved recipes? (create/browse) ").lower().strip()
    if create_or_browse == "create":
        recipe_chatbot(conn)
    elif create_or_browse == "browse":
        display_recipe_db(conn)

# Main function for the chatbot
def recipe_chatbot(conn):
    print("Tell me what ingredients you have and what type of dish you'd like to make.")
    
    while True:
        ingredients_input = input("Enter your ingredients (comma-separated): ")
        cuisine_type = input("Enter the type of cuisine or dish (e.g., Italian, dessert, etc.): ")
        ingredients = [ingredient.strip() for ingredient in ingredients_input.split(",")]

        print("\nThinking of a recipe for you...\n")
        suggestions = get_recipe_suggestions(ingredients, cuisine_type)

        print("Here’s what I came up with:")
        print(suggestions)
        title = get_title(suggestions)

        # Ask if the user wants to save the recipe to the database
        save_to_db = input("\nWould you like to save this recipe to the database? (yes/no): ").lower()
        if save_to_db == "yes":
            save_recipe_to_db(conn, title, ingredients, cuisine_type, suggestions)

        # Ask if the user wants to generate an image
        generate_image = input("\nWould you like to generate an image of this recipe? (yes/no): ").lower()
        if generate_image == "yes":
            generate_recipe_image(title)

        # Ask if the user wants another recipe
        another = input("\nWould you like another recipe suggestion? (yes/no): ").lower()
        if another != "yes":
            print("Thanks for using the Recipe Chatbot! Happy cooking! 👩‍🍳🍳")
            break

    # Close the database connection
    conn.close()

# Run the chatbot
if __name__ == "__main__":
    start()
