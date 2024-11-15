import openai
import base64
import requests

# Set your OpenAI API key
openai.api_key = "api_key"

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
        **Grilled Chicken with Broccoli and Rice**
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
        {"role": "system", "content": "You are a helpful recipe assistant."},
        *few_shot_examples,
        {"role": "user", "content": user_prompt}
    ]
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )
    return response['choices'][0]['message']['content']

# Function to generate an image with DALL-E
def generate_recipe_image(recipe_description):
    # Dynamically construct a concise prompt based on the recipe
    lines = recipe_description.split("\n")
    dish_name = lines[1].strip("* ").strip()  # Extract the dish name
    ingredients = ", ".join([line.strip("- ").strip() for line in lines if line.startswith("  - ")])  # Extract ingredients

    # Construct a concise, dynamic image prompt
    detailed_prompt = f"""
    A semi-realistic photograph of a {dish_name}."
    """
    detailed_prompt = detailed_prompt.strip()[:1000]  # Ensure the prompt is under 1000 characters

    # Use OpenAI's DALL-E API to generate an image
    response = openai.Image.create(
        prompt=detailed_prompt,
        n=1,
        size="1024x1024"
    )
    
    # Extract the URL of the generated image
    image_url = response['data'][0]['url']
    
    # Download the image and save it locally
    image_response = requests.get(image_url)
    if image_response.status_code == 200:
        with open("recipe_image.png", "wb") as f:
            f.write(image_response.content)
        return "recipe_image.png"
    else:
        raise Exception(f"Failed to download the image. Status code: {image_response.status_code}")

# Main function for the chatbot
def recipe_chatbot():
    print("Welcome to the Recipe Chatbot! 🎉")
    print("Tell me what ingredients you have and what type of dish you'd like to make.")
    
    while True:
        ingredients_input = input("Enter your ingredients (comma-separated): ")
        cuisine_type = input("Enter the type of cuisine or dish (e.g., Italian, dessert, etc.): ")
        ingredients = [ingredient.strip() for ingredient in ingredients_input.split(",")]

        print("\nThinking of a recipe for you...\n")
        suggestions = get_recipe_suggestions(ingredients, cuisine_type)

        print("Here’s what I came up with:")
        print(suggestions)

        # Ask if the user wants an image of the recipe
        image_request = input("\nWould you like an image of this recipe? (yes/no): ").lower()
        if image_request == "yes":
            print("Generating an image of the recipe...")
            recipe_image_path = generate_recipe_image(suggestions)
            print(f"Image saved to: {recipe_image_path}")

        # Ask if the user wants another recipe
        another = input("\nWould you like another recipe suggestion? (yes/no): ").lower()
        if another != "yes":
            print("Thanks for using the Recipe Chatbot! Happy cooking! 👩‍🍳🍳")
            break

# Run the chatbot
if __name__ == "__main__":
    recipe_chatbot()
