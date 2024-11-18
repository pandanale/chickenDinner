import sqlite3

DB_PATH = 'recipes.db'

def create_tables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables for users and recipes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            title TEXT,
            ingredients TEXT,
            instructions TEXT,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')
    conn.commit()
    conn.close()

def save_recipe_to_db(username, title, ingredients, instructions):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO recipes (username, title, ingredients, instructions)
        VALUES (?, ?, ?, ?)
    ''', (username, title, ingredients, instructions))
    conn.commit()
    conn.close()

def get_user_recipes(username):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT title, ingredients, instructions FROM recipes WHERE username = ?
    ''', (username,))
    recipes = cursor.fetchall()
    conn.close()
    return recipes

# Initialize the database tables
create_tables()
