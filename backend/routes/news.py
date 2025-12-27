"""
News API Routes - Financial and market news endpoints
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.news import get_news_service

news_bp = Blueprint('news', __name__, url_prefix='/api/news')

# Initialize news service
news_service = get_news_service()


@news_bp.route('', methods=['GET'])
@jwt_required()
def get_news():
    """
    Get aggregated news from multiple sources.

    Query params:
        market: 'all', 'us', 'crypto', 'forex', 'moroccan'
        category: Optional category filter
        limit: Max articles (default 20)
        sentiment: 'positive', 'negative', 'neutral'
    """
    market = request.args.get('market', 'all')
    category = request.args.get('category')
    limit = request.args.get('limit', 20, type=int)
    sentiment = request.args.get('sentiment')

    # Validate limit
    if limit > 100:
        limit = 100

    news = news_service.get_news(
        market=market,
        category=category,
        limit=limit,
        sentiment=sentiment
    )

    return jsonify({
        'news': news,
        'total': len(news),
        'market': market,
        'sources': ['finnhub', 'medias24', 'boursenews', 'lematin', 'lavieeco']
    }), 200


@news_bp.route('/breaking', methods=['GET'])
@jwt_required()
def get_breaking_news():
    """Get breaking news from the last 2 hours."""
    limit = request.args.get('limit', 5, type=int)
    news = news_service.get_breaking_news(limit)

    return jsonify({
        'news': news,
        'total': len(news),
        'type': 'breaking'
    }), 200


@news_bp.route('/symbol/<symbol>', methods=['GET'])
@jwt_required()
def get_news_by_symbol(symbol):
    """Get news related to a specific stock symbol."""
    limit = request.args.get('limit', 10, type=int)
    news = news_service.get_news_by_symbol(symbol, limit)

    return jsonify({
        'news': news,
        'total': len(news),
        'symbol': symbol.upper()
    }), 200


@news_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_market_summary():
    """Get sentiment summary by market."""
    summary = news_service.get_market_summary()

    return jsonify({
        'summary': summary,
        'markets': ['us', 'crypto', 'forex', 'moroccan']
    }), 200


@news_bp.route('/markets', methods=['GET'])
def get_available_markets():
    """Get available market categories (public endpoint)."""
    markets = [
        {'id': 'all', 'name': 'All Markets', 'description': 'News from all sources'},
        {'id': 'us', 'name': 'US Stocks', 'description': 'NYSE, NASDAQ market news'},
        {'id': 'crypto', 'name': 'Cryptocurrency', 'description': 'Bitcoin, Ethereum, and altcoins'},
        {'id': 'forex', 'name': 'Forex', 'description': 'Currency markets news'},
        {'id': 'moroccan', 'name': 'Morocco', 'description': 'Casablanca Bourse and local economy'}
    ]

    return jsonify({'markets': markets}), 200


@news_bp.route('/sentiments', methods=['GET'])
def get_sentiment_types():
    """Get available sentiment types (public endpoint)."""
    sentiments = [
        {'id': 'all', 'name': 'All', 'color': 'gray'},
        {'id': 'positive', 'name': 'Positive', 'color': 'green'},
        {'id': 'neutral', 'name': 'Neutral', 'color': 'blue'},
        {'id': 'negative', 'name': 'Negative', 'color': 'red'}
    ]

    return jsonify({'sentiments': sentiments}), 200
