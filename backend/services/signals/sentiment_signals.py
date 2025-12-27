"""
Sentiment-Based Signals Service
Aggregates news sentiment for trading signals
"""

import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Singleton instance
_sentiment_service = None
_service_lock = threading.Lock()


def get_sentiment_service():
    """Get singleton instance of SentimentSignalsService"""
    global _sentiment_service
    if _sentiment_service is None:
        with _service_lock:
            if _sentiment_service is None:
                _sentiment_service = SentimentSignalsService()
    return _sentiment_service


class SentimentSignalsService:
    """
    Sentiment analysis service that aggregates news sentiment
    for trading signal generation.
    """

    def __init__(self):
        self._cache = {}
        self._cache_duration = 300  # 5 minutes
        self._cache_lock = threading.Lock()

    def _get_news_service(self):
        """Lazy load news service to avoid circular imports"""
        try:
            from services.news import get_news_service
            return get_news_service()
        except ImportError:
            return None

    def get_symbol_sentiment(self, symbol: str, limit: int = 20) -> Dict:
        """
        Get sentiment analysis for a specific symbol
        Returns aggregated sentiment from recent news
        """
        # Check cache
        cache_key = f"sentiment_{symbol}"
        with self._cache_lock:
            if cache_key in self._cache:
                cached = self._cache[cache_key]
                if datetime.now() - cached['cached_at'] < timedelta(seconds=self._cache_duration):
                    return cached['data']

        news_service = self._get_news_service()
        if not news_service:
            return self._empty_sentiment(symbol, "News service unavailable")

        try:
            # Get news for the symbol
            news = news_service.get_news_by_symbol(symbol, limit)

            if not news:
                return self._empty_sentiment(symbol, "No news found for symbol")

            # Aggregate sentiment
            result = self._aggregate_sentiment(symbol, news)

            # Cache result
            with self._cache_lock:
                self._cache[cache_key] = {
                    'data': result,
                    'cached_at': datetime.now()
                }

            return result

        except Exception as e:
            return self._empty_sentiment(symbol, f"Error: {str(e)}")

    def get_market_sentiment(self, market: str = 'all', limit: int = 50) -> Dict:
        """
        Get overall market sentiment from news
        """
        cache_key = f"market_sentiment_{market}"
        with self._cache_lock:
            if cache_key in self._cache:
                cached = self._cache[cache_key]
                if datetime.now() - cached['cached_at'] < timedelta(seconds=self._cache_duration):
                    return cached['data']

        news_service = self._get_news_service()
        if not news_service:
            return {
                'market': market,
                'sentiment': 'neutral',
                'score': 0,
                'confidence': 0,
                'error': 'News service unavailable'
            }

        try:
            news = news_service.get_news(market=market, limit=limit)

            if not news:
                return {
                    'market': market,
                    'sentiment': 'neutral',
                    'score': 0,
                    'confidence': 0,
                    'article_count': 0
                }

            # Count sentiments
            positive = sum(1 for n in news if n.get('sentiment') == 'positive')
            negative = sum(1 for n in news if n.get('sentiment') == 'negative')
            neutral = sum(1 for n in news if n.get('sentiment') == 'neutral')
            total = len(news)

            # Calculate weighted score (-100 to +100)
            # More recent articles get higher weight
            score = 0
            max_weight = total
            for i, article in enumerate(news):
                weight = max_weight - i  # Newer articles have higher weight
                sentiment = article.get('sentiment', 'neutral')
                if sentiment == 'positive':
                    score += weight
                elif sentiment == 'negative':
                    score -= weight

            max_possible = sum(range(1, total + 1))
            normalized_score = int((score / max_possible) * 100) if max_possible > 0 else 0

            # Determine sentiment label
            if normalized_score >= 30:
                sentiment = 'very_bullish'
            elif normalized_score >= 10:
                sentiment = 'bullish'
            elif normalized_score <= -30:
                sentiment = 'very_bearish'
            elif normalized_score <= -10:
                sentiment = 'bearish'
            else:
                sentiment = 'neutral'

            # Confidence based on article count and sentiment consistency
            consistency = max(positive, negative, neutral) / total if total > 0 else 0
            confidence = min(100, int(consistency * 100 * min(1, total / 10)))

            result = {
                'market': market,
                'sentiment': sentiment,
                'score': normalized_score,
                'confidence': confidence,
                'article_count': total,
                'breakdown': {
                    'positive': positive,
                    'negative': negative,
                    'neutral': neutral,
                    'positive_percent': round(positive / total * 100, 1) if total > 0 else 0,
                    'negative_percent': round(negative / total * 100, 1) if total > 0 else 0,
                    'neutral_percent': round(neutral / total * 100, 1) if total > 0 else 0
                },
                'timestamp': datetime.now().isoformat()
            }

            # Cache result
            with self._cache_lock:
                self._cache[cache_key] = {
                    'data': result,
                    'cached_at': datetime.now()
                }

            return result

        except Exception as e:
            return {
                'market': market,
                'sentiment': 'neutral',
                'score': 0,
                'confidence': 0,
                'error': str(e)
            }

    def _aggregate_sentiment(self, symbol: str, news: List[Dict]) -> Dict:
        """Aggregate sentiment from multiple news articles"""
        if not news:
            return self._empty_sentiment(symbol, "No articles to analyze")

        # Count sentiments with time weighting
        total = len(news)
        score = 0
        keywords_found = []

        # Time-weighted scoring
        for i, article in enumerate(news):
            weight = total - i  # Newer articles have higher weight
            sentiment = article.get('sentiment', 'neutral')

            if sentiment == 'positive':
                score += weight * 2
            elif sentiment == 'negative':
                score -= weight * 2

            # Track relevant keywords
            title = article.get('title', '').lower()
            for keyword in ['upgrade', 'beat', 'growth', 'profit', 'bullish']:
                if keyword in title:
                    keywords_found.append(f"+{keyword}")
            for keyword in ['downgrade', 'miss', 'loss', 'decline', 'bearish']:
                if keyword in title:
                    keywords_found.append(f"-{keyword}")

        # Calculate sentiment counts
        positive = sum(1 for n in news if n.get('sentiment') == 'positive')
        negative = sum(1 for n in news if n.get('sentiment') == 'negative')
        neutral = total - positive - negative

        # Normalize score to -100 to +100
        max_possible = sum(range(1, total + 1)) * 2
        normalized_score = int((score / max_possible) * 100) if max_possible > 0 else 0

        # Determine sentiment label
        if normalized_score >= 40:
            sentiment = 'very_bullish'
            signal = 'strong_buy'
        elif normalized_score >= 15:
            sentiment = 'bullish'
            signal = 'buy'
        elif normalized_score <= -40:
            sentiment = 'very_bearish'
            signal = 'strong_sell'
        elif normalized_score <= -15:
            sentiment = 'bearish'
            signal = 'sell'
        else:
            sentiment = 'neutral'
            signal = 'hold'

        # Calculate confidence
        dominance = max(positive, negative, neutral) / total if total > 0 else 0
        confidence = min(100, int(dominance * 100 * min(1.5, total / 5)))

        return {
            'symbol': symbol,
            'sentiment': sentiment,
            'signal': signal,
            'score': normalized_score,
            'confidence': confidence,
            'article_count': total,
            'breakdown': {
                'positive': positive,
                'negative': negative,
                'neutral': neutral
            },
            'keywords': list(set(keywords_found))[:10],
            'latest_headlines': [n.get('title', '')[:100] for n in news[:3]],
            'timestamp': datetime.now().isoformat()
        }

    def _empty_sentiment(self, symbol: str, reason: str) -> Dict:
        """Return empty sentiment result"""
        return {
            'symbol': symbol,
            'sentiment': 'neutral',
            'signal': 'hold',
            'score': 0,
            'confidence': 0,
            'article_count': 0,
            'breakdown': {'positive': 0, 'negative': 0, 'neutral': 0},
            'keywords': [],
            'reason': reason,
            'timestamp': datetime.now().isoformat()
        }

    def get_combined_signal(self, symbol: str, prices: List[float] = None) -> Dict:
        """
        Get combined signal from sentiment and technical analysis
        """
        # Get sentiment signal
        sentiment = self.get_symbol_sentiment(symbol)

        # Get technical signal if prices available
        technical = None
        if prices and len(prices) >= 26:
            try:
                from .technical_signals import get_technical_service
                tech_service = get_technical_service()
                technical = tech_service.get_signal_for_symbol(symbol, prices)
            except Exception as e:
                pass

        # Combine signals
        sentiment_score = sentiment.get('score', 0)
        tech_score = technical.get('score', 0) if technical else 0

        # Weight: 40% sentiment, 60% technical
        combined_score = int(sentiment_score * 0.4 + tech_score * 0.6)

        # Determine combined signal
        if combined_score >= 40:
            combined_signal = 'strong_buy'
        elif combined_score >= 15:
            combined_signal = 'buy'
        elif combined_score <= -40:
            combined_signal = 'strong_sell'
        elif combined_score <= -15:
            combined_signal = 'sell'
        else:
            combined_signal = 'hold'

        # Combined confidence
        sentiment_conf = sentiment.get('confidence', 0)
        tech_conf = technical.get('confidence', 50) if technical else 50
        combined_confidence = int(sentiment_conf * 0.3 + tech_conf * 0.7)

        return {
            'symbol': symbol,
            'combined_signal': combined_signal,
            'combined_score': combined_score,
            'combined_confidence': combined_confidence,
            'sentiment': {
                'signal': sentiment.get('signal', 'hold'),
                'score': sentiment_score,
                'confidence': sentiment_conf,
                'article_count': sentiment.get('article_count', 0)
            },
            'technical': {
                'signal': technical.get('signal', 'hold') if technical else 'unavailable',
                'score': tech_score,
                'confidence': tech_conf
            } if technical else None,
            'entry_price': technical.get('entry_price') if technical else None,
            'stop_loss': technical.get('stop_loss') if technical else None,
            'take_profit': technical.get('take_profit') if technical else None,
            'reasons': [
                f"Sentiment: {sentiment.get('sentiment', 'neutral')}",
                f"News articles: {sentiment.get('article_count', 0)}",
            ] + (technical.get('reasons', [])[:3] if technical else []),
            'timestamp': datetime.now().isoformat()
        }

    def clear_cache(self, symbol: str = None):
        """Clear sentiment cache"""
        with self._cache_lock:
            if symbol:
                keys_to_remove = [k for k in self._cache if symbol in k]
                for k in keys_to_remove:
                    del self._cache[k]
            else:
                self._cache.clear()
