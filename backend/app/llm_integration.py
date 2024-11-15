
# THIS CODE IS TEMPORARY AND ITS FROM CHAT gpt
import openai


# Set your OpenAI API key
openai.api_key = "your_openai_api_key"

# Function to query the LLM
def get_recipe_suggestions(ingredients, cuisine_type):
    # Construct the prompt
    prompt = f"""
    I have the following ingredients: {', '.join(ingredients)}.
    I want to make a dish that is {cuisine_type}.
    Please suggest 2-3 recipes with ingredients and instructions.
    """
    
    # Call the OpenAI API
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful recipe assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        raise Exception(f"Error querying the LLM: {str(e)}")
