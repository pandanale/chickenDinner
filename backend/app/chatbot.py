from openai import OpenAI
import sqlite3
import os
import re
import requests

client = OpenAI(
    api_key =""
)

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
        Grilled Chicken with Broccoli and Rice
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
        max_tokens=2000,
    )
    recipe_text = response.choices[0].message.content

    return jsonify_content(recipe_text)
    
def jsonify_content(recipe_text):
    title = get_title(recipe_text)
    title = title.replace('#', '')

    ingredients_list = recipe_text.split("Ingredients:")[1].split("Instructions:")[0].strip().split('\n')
    if ingredients_list:
        if ingredients_list[0] in ("*", "**"):
            ingredients_list = ingredients_list[1:]
        if ingredients_list[-1] in ("*", "**", "###", "####"):
            ingredients_list = ingredients_list[:-1]

    instructions = recipe_text.split("Instructions:")[1].strip()
    instructions = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', instructions)
    instructions = instructions.replace('\n', '<br>')  

    return {
        "title": title,
        "ingredients": ingredients_list,
        "instructions": instructions
    }

# Different modes
def make_it_special(recipe_dict, cuisine_type):
    if cuisine_type == "spicy":
        prompt = [{"role": "user", "content": """Below is a JSON dictionary containing a recipe. Please take this recipe and make it spicy, and return
                the spicy version of the recipe. Make sure the title starts with ###""" + str(recipe_dict)},
    *few_shot_examples]
    elif cuisine_type == "vegetarian":
        prompt = [{"role": "user", "content": """Below is a JSON dictionary containing a recipe. Please take this recipe and make it vegetarian, and return
                the vegetarian version of the recipe. Make sure the title starts with ###""" + str(recipe_dict)},
    *few_shot_examples]
    elif cuisine_type == "kosher":
        prompt = [{"role": "user", "content": """Below is a JSON dictionary containing a recipe. Please take this recipe and make it kosher, and return
                the kosher version of the recipe. Make sure the title starts with ###""" + str(recipe_dict)},
    *few_shot_examples]           

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=prompt,
        temperature=0.7,
        max_tokens=2000,
    )
    recipe_text = response.choices[0].message.content

    recipe = jsonify_content(recipe_text)
    if cuisine_type == "spicy":
        recipe['message'] = "Damnnn, you like it HOT! Here's what I came up with:"
    elif cuisine_type == "vegetarian":
        recipe['message'] = "Okay, I see you with that meatless magic! Here's what I came up with:"
    elif cuisine_type == "kosher":
        recipe['message'] = "Here's a Kosher recipe! Here's what I came up with:"
    return recipe

def get_title(recipe_description):
    lines = recipe_description.split('\n')
    title = next((line for line in lines if line.startswith('###')), None)
    return title


def generate_recipe_image(title):
    prompt = f"Realistic image of a dish: {title}. Present it in a modern, well lit setting"
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        
        image_data = requests.get(image_url).content
        with open("recipe_image.png", "wb") as f:
            f.write(image_data)
        print("Image generated and saved as recipe_image.png.")
    except Exception as e:
        print(f"Error generating image: {e}")
    return image_url


def handle_recipe_questions(recipe, question):
    if isinstance(recipe, str):
        recipe_text = recipe
    else:
        # Convert dictionary to formatted str
        recipe_text = f"""
        Recipe Title: {recipe.get('title', 'N/A')}
        Ingredients: {', '.join(recipe.get('ingredients', []))}
        Instructions: {recipe.get('instructions', 'N/A')}
        """
    
    prompt = f"""
    You are a helpful recipe assistant. Here is the recipe:

    {recipe_text}
    
    User Question: {question}
    
    Provide a helpful response based on the recipe above.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a helpful cooking assistant."},
                      {"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7,
        )
        
        # Extract and return the answer
        return response.choices[0].message.content.strip()
    except Exception as e:
        return "I'm having trouble answering your question right now. Please try again later."
