"""
WebSocket Service for Real-Time Updates
Handles price broadcasts, trade updates, and notifications
"""

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
import threading
import time

# Initialize SocketIO (will be configured in app.py)
socketio = SocketIO()

# Store connected users and their rooms
connected_users = {}

# Watchlist for price updates (symbols that users are watching)
price_watchlist = set()


def init_socketio(app):
    """Initialize SocketIO with the Flask app"""
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=False,
        engineio_logger=False
    )
    return socketio


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to TradeSense WebSocket'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    sid = request.sid
    print(f"Client disconnected: {sid}")

    # Remove from connected users
    if sid in connected_users:
        user_id = connected_users[sid]
        leave_room(f"user_{user_id}")
        del connected_users[sid]


@socketio.on('authenticate')
def handle_authenticate(data):
    """Authenticate user via JWT token"""
    token = data.get('token')
    if not token:
        emit('auth_error', {'error': 'No token provided'})
        return

    try:
        # Decode JWT token
        decoded = decode_token(token)
        user_id = decoded.get('sub')

        if user_id:
            # Store user connection
            connected_users[request.sid] = user_id
            # Join user-specific room for private notifications
            join_room(f"user_{user_id}")
            emit('authenticated', {'user_id': user_id, 'message': 'Authentication successful'})
            print(f"User {user_id} authenticated on {request.sid}")
        else:
            emit('auth_error', {'error': 'Invalid token'})
    except Exception as e:
        print(f"Auth error: {e}")
        emit('auth_error', {'error': 'Token verification failed'})


@socketio.on('subscribe_prices')
def handle_subscribe_prices(data):
    """Subscribe to price updates for specific symbols"""
    symbols = data.get('symbols', [])

    for symbol in symbols:
        # Add to global watchlist
        price_watchlist.add(symbol.upper())
        # Join symbol-specific room
        join_room(f"price_{symbol.upper()}")

    emit('subscribed', {'symbols': symbols, 'message': 'Subscribed to price updates'})
    print(f"Client {request.sid} subscribed to: {symbols}")


@socketio.on('unsubscribe_prices')
def handle_unsubscribe_prices(data):
    """Unsubscribe from price updates"""
    symbols = data.get('symbols', [])

    for symbol in symbols:
        leave_room(f"price_{symbol.upper()}")

    emit('unsubscribed', {'symbols': symbols})


def broadcast_price_update(symbol, price_data):
    """Broadcast price update to all subscribers of a symbol"""
    socketio.emit('price_update', {
        'symbol': symbol,
        'price': price_data.get('price'),
        'change': price_data.get('change'),
        'change_percent': price_data.get('change_percent'),
        'timestamp': time.time()
    }, room=f"price_{symbol.upper()}")


def broadcast_prices_batch(prices):
    """Broadcast multiple price updates at once"""
    socketio.emit('prices_batch', {
        'prices': prices,
        'timestamp': time.time()
    })


def notify_user(user_id, event_type, data):
    """Send notification to specific user"""
    socketio.emit(event_type, data, room=f"user_{user_id}")


def notify_trade_update(user_id, trade_data):
    """Notify user about trade update"""
    notify_user(user_id, 'trade_update', {
        'trade': trade_data,
        'timestamp': time.time()
    })


def notify_challenge_status(user_id, challenge_data):
    """Notify user about challenge status change"""
    notify_user(user_id, 'challenge_status', {
        'challenge': challenge_data,
        'timestamp': time.time()
    })


def notify_challenge_warning(user_id, warning_type, message, current_value, limit_value):
    """Notify user about approaching challenge limits"""
    notify_user(user_id, 'challenge_warning', {
        'type': warning_type,
        'message': message,
        'current': current_value,
        'limit': limit_value,
        'timestamp': time.time()
    })


# Price update background task
class PriceUpdater:
    """Background service to fetch and broadcast prices"""

    # Popular symbols to pre-cache on startup
    POPULAR_SYMBOLS = [
        # Top US Stocks
        'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA',
        'NFLX', 'AMD', 'JPM', 'V', 'MA',
        # Top Crypto
        'BTC-USD', 'ETH-USD', 'XRP-USD', 'SOL-USD', 'DOGE-USD',
        'ADA-USD', 'DOT-USD', 'LINK-USD'
    ]

    def __init__(self, interval=10):
        self.interval = interval
        self.running = False
        self.thread = None
        self.prices_cached = False

    def start(self):
        """Start the price updater"""
        if not self.running:
            self.running = True
            # Pre-cache prices before starting the loop
            self._precache_prices()
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            print(f"Price updater started (interval: {self.interval}s)")

    def stop(self):
        """Stop the price updater"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)

    def _precache_prices(self):
        """Pre-cache popular symbols to avoid cold start latency"""
        print("Pre-caching popular symbols...")
        try:
            from services.yfinance_service import get_multiple_prices
            prices = get_multiple_prices(self.POPULAR_SYMBOLS)
            if prices:
                self.prices_cached = True
                print(f"Pre-cached {len(prices)} symbols successfully")
        except Exception as e:
            print(f"Pre-cache error: {e}")

    def _run(self):
        """Main loop for fetching and broadcasting prices"""
        from services.yfinance_service import get_multiple_prices
        from services.market_scraper import get_moroccan_stocks

        while self.running:
            try:
                # Combine popular symbols with user watchlist
                symbols_to_fetch = list(set(self.POPULAR_SYMBOLS) | price_watchlist)

                if symbols_to_fetch:
                    # Fetch US/Crypto prices
                    prices = get_multiple_prices(symbols_to_fetch)

                    # Fetch Moroccan prices
                    moroccan_prices = get_moroccan_stocks()
                    if moroccan_prices:
                        prices.update(moroccan_prices)

                    if prices:
                        # Broadcast batch update
                        broadcast_prices_batch(prices)

                        # Also broadcast individual updates for subscribed rooms
                        for symbol, data in prices.items():
                            broadcast_price_update(symbol, data)

            except Exception as e:
                print(f"Price updater error: {e}")

            time.sleep(self.interval)


# Global price updater instance (1 second for real-time crypto updates)
price_updater = PriceUpdater(interval=1)
