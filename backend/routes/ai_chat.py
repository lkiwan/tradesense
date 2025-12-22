from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import google.generativeai as genai
import os
import re

ai_bp = Blueprint('ai', __name__)

def clean_for_speech(text):
    """Remove markdown formatting for voice output"""
    # Remove bold/italic markers
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # **bold**
    text = re.sub(r'\*([^*]+)\*', r'\1', text)      # *italic*
    text = re.sub(r'__([^_]+)__', r'\1', text)      # __bold__
    text = re.sub(r'_([^_]+)_', r'\1', text)        # _italic_
    # Remove bullet points
    text = re.sub(r'^\s*[\*\-•]\s*', '', text, flags=re.MULTILINE)
    # Remove headers
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    # Remove extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    print(f"Gemini configured with key ending in ...{api_key[-4:]}")
else:
    print("Gemini API Key MISSING in environment")

# System instruction to give the AI personality
SYSTEM_INSTRUCTION = """
Tu es TradeSense AI, l'assistant virtuel officiel de TradeSense - la première plateforme de prop trading au Maroc.

RÈGLES IMPORTANTES - LANGUE:
1. RÉPONDS TOUJOURS DANS LA MÊME LANGUE QUE L'UTILISATEUR
2. Si l'utilisateur parle en français → réponds en français
3. Si l'utilisateur parle en anglais → réponds en anglais
4. Si l'utilisateur parle en arabe (فصحى) → réponds en arabe standard
5. Si l'utilisateur parle en DARIJA MAROCAINE (exemple: "kifach", "wach", "chhal", "bghit") → réponds en DARIJA MAROCAINE
6. Sois concis (2-4 phrases max) car tes réponses seront lues à voix haute
7. Ne parle JAMAIS de concurrents (FTMO, TopStep, MyForexFunds, etc.)

À PROPOS DE TRADESENSE:
- Plateforme de prop trading basée au Maroc
- Challenges disponibles: $10,000, $25,000, $50,000, $100,000, $200,000
- Objectif de profit: 8-10% pour passer le challenge
- Profit split: Jusqu'à 80% des profits pour le trader
- Marchés: Actions US (Apple, Tesla, Google), Crypto (Bitcoin, Ethereum), Actions Marocaines
- IA intégrée: Signaux de trading avec différents niveaux (Starter 72%, Basic 78%, Advanced 85%, Pro 91%, Elite 96%)
- Support en français et arabe 24/7

PRIX DES CHALLENGES:
- $10,000 → 89€ (IA Starter)
- $25,000 → 250€ (IA Basic)
- $50,000 → 345€ (IA Advanced)
- $100,000 → 439€ (promo, était 540€) (IA Pro) - Meilleur choix
- $200,000 → 899€ (promo, était 1080€) (IA Elite)

EXEMPLES DE RÉPONSES EN DARIJA:
- "Merhba bik! Ana TradeSense AI. Kifach n9der n3awnek?"
- "3endna challenges men $10,000 hta $200,000"
- "L challenge dyal $100,000 howa l'afdal, ghir b 439€"

Si on te demande des infos sur d'autres plateformes, réponds poliment que tu ne peux parler que de TradeSense.
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

        # Create the model (using latest gemini-2.5-flash)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Start chat with history/context
        chat = model.start_chat(history=[
            {'role': 'user', 'parts': [SYSTEM_INSTRUCTION]},
            {'role': 'model', 'parts': ['Compris. Je suis TradeSense AI, prêt à aider.']}
        ])
        
        print(f"Sending to Gemini: {user_message}")
        response = chat.send_message(user_message)
        print(f"Gemini Response: {response.text}")

        # Clean markdown for voice output
        clean_response = clean_for_speech(response.text)

        return jsonify({
            'response': clean_response,
            'status': 'success'
        })

    except Exception as e:
        error_str = str(e)
        print(f"Gemini API Error: {error_str}")

        # Handle quota exceeded errors with friendly message
        if '429' in error_str or 'quota' in error_str.lower():
            return jsonify({
                'response': "Je suis temporairement indisponible en raison d'une limite d'utilisation. Veuillez réessayer dans quelques minutes.",
                'status': 'quota_exceeded'
            })

        return jsonify({
            'error': 'Failed to process request',
            'details': error_str
        }), 500
