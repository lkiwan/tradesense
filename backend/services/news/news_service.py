"""
News Service - Aggregates financial news from multiple sources

Data Sources:
1. Finnhub API (free tier - general, forex, crypto news)
2. Moroccan news scrapers (medias24, boursenews, etc.)
3. RSS feeds (fallback)
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import logging
import re
import os
from typing import Dict, List, Optional, Any
import hashlib

logger = logging.getLogger(__name__)


class NewsService:
    """
    News aggregation service with multi-source support and sentiment analysis.
    """

    # API endpoints
    FINNHUB_BASE = "https://finnhub.io/api/v1"

    # Moroccan news sources
    MOROCCAN_SOURCES = {
        "medias24": {
            "url": "https://www.medias24.com/economie",
            "name": "Medias24",
            "category": "business"
        },
        "boursenews": {
            "url": "https://www.boursenews.ma/",
            "name": "BourseNews",
            "category": "market"
        },
        "lematin": {
            "url": "https://lematin.ma/economie",
            "name": "Le Matin",
            "category": "economy"
        },
        "lavieeco": {
            "url": "https://www.lavieeco.com/economie/",
            "name": "La Vie Eco",
            "category": "finance"
        }
    }

    # Sentiment keywords for basic analysis
    POSITIVE_KEYWORDS = [
        'surge', 'gain', 'rise', 'jump', 'soar', 'rally', 'boost', 'growth',
        'profit', 'bullish', 'record', 'high', 'success', 'outperform', 'beat',
        'hausse', 'croissance', 'benefice', 'progression', 'succes', 'amelioration'
    ]
    NEGATIVE_KEYWORDS = [
        'fall', 'drop', 'decline', 'crash', 'plunge', 'loss', 'bearish', 'slump',
        'cut', 'miss', 'risk', 'fear', 'warning', 'crisis', 'concern', 'weak',
        'baisse', 'chute', 'perte', 'crise', 'risque', 'recul', 'inquietude'
    ]

    def __init__(self, cache_service=None):
        self.cache = cache_service
        self.finnhub_key = os.environ.get('FINNHUB_API_KEY', '')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.cache_ttl = 300  # 5 minutes

    def get_news(self, market: str = "all", category: str = None,
                 limit: int = 20, sentiment: str = None) -> List[Dict]:
        """
        Get aggregated news from all sources.

        Args:
            market: 'all', 'us', 'crypto', 'forex', 'moroccan'
            category: Optional category filter
            limit: Maximum number of articles
            sentiment: Filter by 'positive', 'negative', 'neutral'
        """
        cache_key = f"news_{market}_{category}_{limit}"

        # Check cache
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                news = cached
            else:
                news = self._fetch_all_news(market, category)
                self.cache.set(cache_key, news, ex=self.cache_ttl)
        else:
            news = self._fetch_all_news(market, category)

        # Filter by sentiment if specified
        if sentiment and sentiment != 'all':
            news = [n for n in news if n.get('sentiment', 'neutral') == sentiment]

        # Sort by date (newest first)
        news.sort(key=lambda x: x.get('published_at', ''), reverse=True)

        return news[:limit]

    def get_breaking_news(self, limit: int = 5) -> List[Dict]:
        """Get high-impact breaking news from last 2 hours."""
        all_news = self.get_news(market='all', limit=50)
        two_hours_ago = datetime.utcnow() - timedelta(hours=2)

        breaking = []
        for article in all_news:
            try:
                pub_date = datetime.fromisoformat(article.get('published_at', '').replace('Z', '+00:00'))
                if pub_date.replace(tzinfo=None) > two_hours_ago:
                    breaking.append(article)
            except (ValueError, TypeError):
                continue

        return breaking[:limit]

    def get_news_by_symbol(self, symbol: str, limit: int = 10) -> List[Dict]:
        """Get news related to a specific stock symbol."""
        all_news = self.get_news(market='all', limit=100)

        # Filter by symbol mention in title or summary
        symbol_upper = symbol.upper()
        related = []
        for article in all_news:
            title = article.get('title', '').upper()
            summary = article.get('summary', '').upper()
            related_symbols = article.get('related', [])

            if symbol_upper in title or symbol_upper in summary or symbol_upper in related_symbols:
                related.append(article)

        return related[:limit]

    def _fetch_all_news(self, market: str, category: str = None) -> List[Dict]:
        """Fetch news from all configured sources."""
        news = []

        # Finnhub for international news
        if market in ['all', 'us', 'general']:
            try:
                finnhub_news = self._fetch_finnhub('general')
                news.extend(finnhub_news)
            except Exception as e:
                logger.warning(f"Finnhub general news failed: {e}")

        if market in ['all', 'crypto']:
            try:
                crypto_news = self._fetch_finnhub('crypto')
                news.extend(crypto_news)
            except Exception as e:
                logger.warning(f"Finnhub crypto news failed: {e}")

        if market in ['all', 'forex']:
            try:
                forex_news = self._fetch_finnhub('forex')
                news.extend(forex_news)
            except Exception as e:
                logger.warning(f"Finnhub forex news failed: {e}")

        # Moroccan news
        if market in ['all', 'moroccan']:
            try:
                moroccan_news = self._fetch_moroccan_news()
                news.extend(moroccan_news)
            except Exception as e:
                logger.warning(f"Moroccan news failed: {e}")

        # Deduplicate
        news = self._deduplicate(news)

        return news

    def _fetch_finnhub(self, category: str) -> List[Dict]:
        """Fetch news from Finnhub API."""
        if not self.finnhub_key:
            logger.debug("No Finnhub API key configured")
            return []

        try:
            url = f"{self.FINNHUB_BASE}/news"
            params = {
                'category': category,
                'token': self.finnhub_key
            }
            response = self.session.get(url, params=params, timeout=10)

            if response.status_code == 200:
                articles = response.json()
                return [self._normalize_finnhub(a, category) for a in articles[:30]]
        except Exception as e:
            logger.error(f"Finnhub API error: {e}")

        return []

    def _normalize_finnhub(self, article: Dict, category: str) -> Dict:
        """Normalize Finnhub article to standard format."""
        title = article.get('headline', '')
        summary = article.get('summary', '')

        return {
            'id': self._generate_id(title),
            'title': title,
            'summary': summary[:300] + '...' if len(summary) > 300 else summary,
            'url': article.get('url', ''),
            'image': article.get('image', ''),
            'source': article.get('source', 'Finnhub'),
            'category': category,
            'market': self._map_category_to_market(category),
            'published_at': datetime.fromtimestamp(article.get('datetime', 0)).isoformat(),
            'sentiment': self._analyze_sentiment(title + ' ' + summary),
            'related': article.get('related', '').split(',') if article.get('related') else []
        }

    def _fetch_moroccan_news(self) -> List[Dict]:
        """Fetch news from Moroccan sources via scraping."""
        news = []

        for source_key, source_info in self.MOROCCAN_SOURCES.items():
            try:
                source_news = self._scrape_moroccan_source(source_key, source_info)
                news.extend(source_news)
            except Exception as e:
                logger.debug(f"Failed to scrape {source_key}: {e}")

        return news

    def _scrape_moroccan_source(self, source_key: str, source_info: Dict) -> List[Dict]:
        """Scrape a single Moroccan news source."""
        articles = []

        try:
            response = self.session.get(source_info['url'], timeout=10)
            if response.status_code != 200:
                return articles

            soup = BeautifulSoup(response.text, 'html.parser')

            # Different parsing for each source
            if source_key == 'medias24':
                articles = self._parse_medias24(soup, source_info)
            elif source_key == 'boursenews':
                articles = self._parse_boursenews(soup, source_info)
            elif source_key == 'lematin':
                articles = self._parse_lematin(soup, source_info)
            elif source_key == 'lavieeco':
                articles = self._parse_lavieeco(soup, source_info)

        except Exception as e:
            logger.debug(f"Scraping error for {source_key}: {e}")

        return articles

    def _parse_medias24(self, soup: BeautifulSoup, source_info: Dict) -> List[Dict]:
        """Parse Medias24 articles."""
        articles = []
        items = soup.select('article, .article-item, .post-item')[:10]

        for item in items:
            try:
                title_elem = item.select_one('h2, h3, .title, a[title]')
                link_elem = item.select_one('a[href]')

                if title_elem and link_elem:
                    title = title_elem.get_text(strip=True)
                    url = link_elem.get('href', '')
                    if not url.startswith('http'):
                        url = 'https://www.medias24.com' + url

                    summary_elem = item.select_one('p, .excerpt, .summary')
                    summary = summary_elem.get_text(strip=True) if summary_elem else ''

                    articles.append({
                        'id': self._generate_id(title),
                        'title': title,
                        'summary': summary[:200] if summary else title,
                        'url': url,
                        'image': '',
                        'source': source_info['name'],
                        'category': source_info['category'],
                        'market': 'moroccan',
                        'published_at': datetime.utcnow().isoformat(),
                        'sentiment': self._analyze_sentiment(title + ' ' + summary),
                        'related': [],
                        'language': 'fr'
                    })
            except Exception:
                continue

        return articles

    def _parse_boursenews(self, soup: BeautifulSoup, source_info: Dict) -> List[Dict]:
        """Parse BourseNews articles."""
        articles = []
        items = soup.select('.article, .news-item, article')[:10]

        for item in items:
            try:
                title_elem = item.select_one('h2, h3, .title, a')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link = item.select_one('a[href]')
                    url = link.get('href', '') if link else ''
                    if url and not url.startswith('http'):
                        url = 'https://www.boursenews.ma' + url

                    articles.append({
                        'id': self._generate_id(title),
                        'title': title,
                        'summary': title,
                        'url': url,
                        'image': '',
                        'source': source_info['name'],
                        'category': source_info['category'],
                        'market': 'moroccan',
                        'published_at': datetime.utcnow().isoformat(),
                        'sentiment': self._analyze_sentiment(title),
                        'related': [],
                        'language': 'fr'
                    })
            except Exception:
                continue

        return articles

    def _parse_lematin(self, soup: BeautifulSoup, source_info: Dict) -> List[Dict]:
        """Parse Le Matin articles."""
        articles = []
        items = soup.select('article, .post, .entry')[:10]

        for item in items:
            try:
                title_elem = item.select_one('h2, h3, .entry-title, a[title]')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link = item.select_one('a[href]')
                    url = link.get('href', '') if link else ''

                    articles.append({
                        'id': self._generate_id(title),
                        'title': title,
                        'summary': title,
                        'url': url,
                        'image': '',
                        'source': source_info['name'],
                        'category': source_info['category'],
                        'market': 'moroccan',
                        'published_at': datetime.utcnow().isoformat(),
                        'sentiment': self._analyze_sentiment(title),
                        'related': [],
                        'language': 'fr'
                    })
            except Exception:
                continue

        return articles

    def _parse_lavieeco(self, soup: BeautifulSoup, source_info: Dict) -> List[Dict]:
        """Parse La Vie Eco articles."""
        articles = []
        items = soup.select('article, .post-item, .article-card')[:10]

        for item in items:
            try:
                title_elem = item.select_one('h2, h3, .title a, a.title')
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    link = item.select_one('a[href]')
                    url = link.get('href', '') if link else ''
                    if url and not url.startswith('http'):
                        url = 'https://www.lavieeco.com' + url

                    articles.append({
                        'id': self._generate_id(title),
                        'title': title,
                        'summary': title,
                        'url': url,
                        'image': '',
                        'source': source_info['name'],
                        'category': source_info['category'],
                        'market': 'moroccan',
                        'published_at': datetime.utcnow().isoformat(),
                        'sentiment': self._analyze_sentiment(title),
                        'related': [],
                        'language': 'fr'
                    })
            except Exception:
                continue

        return articles

    def _analyze_sentiment(self, text: str) -> str:
        """Simple keyword-based sentiment analysis."""
        text_lower = text.lower()

        positive_count = sum(1 for word in self.POSITIVE_KEYWORDS if word in text_lower)
        negative_count = sum(1 for word in self.NEGATIVE_KEYWORDS if word in text_lower)

        if positive_count > negative_count + 1:
            return 'positive'
        elif negative_count > positive_count + 1:
            return 'negative'
        else:
            return 'neutral'

    def _map_category_to_market(self, category: str) -> str:
        """Map Finnhub category to market type."""
        mapping = {
            'general': 'us',
            'crypto': 'crypto',
            'forex': 'forex',
            'merger': 'us'
        }
        return mapping.get(category, 'us')

    def _generate_id(self, title: str) -> str:
        """Generate unique ID from title."""
        return hashlib.md5(title.encode()).hexdigest()[:12]

    def _deduplicate(self, news: List[Dict]) -> List[Dict]:
        """Remove duplicate articles based on title similarity."""
        seen_titles = set()
        unique = []

        for article in news:
            # Create simplified title for comparison
            title = article.get('title', '').lower()
            title_words = set(re.findall(r'\w+', title))

            # Check if similar title exists
            is_duplicate = False
            for seen in seen_titles:
                seen_words = set(re.findall(r'\w+', seen))
                # Consider duplicate if 70% words match
                if title_words and seen_words:
                    overlap = len(title_words & seen_words) / max(len(title_words), len(seen_words))
                    if overlap > 0.7:
                        is_duplicate = True
                        break

            if not is_duplicate:
                seen_titles.add(title)
                unique.append(article)

        return unique

    def get_market_summary(self) -> Dict:
        """Get a summary of news sentiment by market."""
        all_news = self.get_news(market='all', limit=100)

        summary = {
            'us': {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0},
            'crypto': {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0},
            'forex': {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0},
            'moroccan': {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}
        }

        for article in all_news:
            market = article.get('market', 'us')
            sentiment = article.get('sentiment', 'neutral')
            if market in summary:
                summary[market][sentiment] += 1
                summary[market]['total'] += 1

        # Calculate overall sentiment
        for market in summary:
            total = summary[market]['total']
            if total > 0:
                pos = summary[market]['positive']
                neg = summary[market]['negative']
                if pos > neg * 1.5:
                    summary[market]['overall'] = 'bullish'
                elif neg > pos * 1.5:
                    summary[market]['overall'] = 'bearish'
                else:
                    summary[market]['overall'] = 'neutral'
            else:
                summary[market]['overall'] = 'no_data'

        return summary


# Singleton instance
_news_service = None


def get_news_service(cache_service=None) -> NewsService:
    """Get or create singleton NewsService instance."""
    global _news_service
    if _news_service is None:
        _news_service = NewsService(cache_service)
    return _news_service
