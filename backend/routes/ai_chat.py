from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import google.generativeai as genai
import os

ai_bp = Blueprint('ai', __name__)

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    print(f"Gemini configured with key ending in ...{api_key[-4:]}")
else:
    print("Gemini API Key MISSING in environment")

# System instruction to give the AI personality
SYSTEM_INSTRUCTION = """
You are TradeSense AI, an intelligent, professional, yet friendly virtual assistant.
"""

@ai_bp.route('/api/ai/chat', methods=['POST', 'OPTIONS'])
@cross_origin()
def chat():
    print("AI Chat Request Received")
    if not api_key:
        print("Error: API Key missing")
        return jsonify({'error': 'AI configuration missing'}), 503

    try:
        data = request.json
        print(f"Received data: {data}")
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message required'}), 400

        # Create the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Start chat with history/context
        chat = model.start_chat(history=[
            {'role': 'user', 'parts': [SYSTEM_INSTRUCTION]},
            {'role': 'model', 'parts': ['Understood. I am TradeSense AI.']}
        ])
        
        print(f"Sending to Gemini: {user_message}")
        response = chat.send_message(user_message)
        print(f"Gemini Response: {response.text}")
        
        return jsonify({
            'response': response.text,
            'status': 'success'
        })

    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return jsonify({
            'error': 'Failed to process request',
            'details': str(e)
        }), 500
