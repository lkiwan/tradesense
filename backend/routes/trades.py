import logging
import requests
import urllib3
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from . import trades_bp
from models import db, Trade, UserChallenge, User
from services.challenge_engine import ChallengeEngine
from services.yfinance_service import get_current_price, get_live_price_data
from middleware.rate_limiter import limiter
from services.audit_service import AuditService

# Suppress SSL warnings for verify=False requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


def _fetch_crypto_price_direct(symbol: str) -> float | None:
    """Direct fetch crypto price - tries Kraken first (works from US), then Coinbase, then CoinGecko"""
    symbol_upper = symbol.upper()

    # Map symbols to Kraken format (XXBTZUSD = BTC/USD)
    kraken_map = {
        'BTC-USD': 'XXBTZUSD', 'BTCUSD': 'XXBTZUSD', 'BTC': 'XXBTZUSD',
        'ETH-USD': 'XETHZUSD', 'ETHUSD': 'XETHZUSD', 'ETH': 'XETHZUSD',
        'SOL-USD': 'SOLUSD', 'SOLUSD': 'SOLUSD', 'SOL': 'SOLUSD',
        'XRP-USD': 'XXRPZUSD', 'XRPUSD': 'XXRPZUSD', 'XRP': 'XXRPZUSD',
        'ADA-USD': 'ADAUSD', 'ADAUSD': 'ADAUSD', 'ADA': 'ADAUSD',
        'DOGE-USD': 'XDGUSD', 'DOGEUSD': 'XDGUSD', 'DOGE': 'XDGUSD',
    }

    # Try Kraken first (works from US, no geo-restrictions)
    kraken_symbol = kraken_map.get(symbol_upper)
    if kraken_symbol:
        try:
            url = f"https://api.kraken.com/0/public/Ticker?pair={kraken_symbol}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if not data.get('error'):
                    result = data.get('result', {})
                    # Kraken returns data with the pair as key
                    for pair_key, pair_data in result.items():
                        price = float(pair_data.get('c', [0])[0])  # 'c' = last trade closed [price, lot volume]
                        if price > 0:
                            logger.info(f"Kraken price for {symbol}: {price}")
                            return price
            else:
                logger.warning(f"Kraken API returned status {resp.status_code}")
        except Exception as e:
            logger.warning(f"Kraken fetch failed for {symbol}: {e}")

    # Try Coinbase (also works from US)
    coinbase_map = {
        'BTC-USD': 'BTC-USD', 'BTCUSD': 'BTC-USD', 'BTC': 'BTC-USD',
        'ETH-USD': 'ETH-USD', 'ETHUSD': 'ETH-USD', 'ETH': 'ETH-USD',
        'SOL-USD': 'SOL-USD', 'SOLUSD': 'SOL-USD', 'SOL': 'SOL-USD',
        'XRP-USD': 'XRP-USD', 'XRPUSD': 'XRP-USD', 'XRP': 'XRP-USD',
        'ADA-USD': 'ADA-USD', 'ADAUSD': 'ADA-USD', 'ADA': 'ADA-USD',
        'DOGE-USD': 'DOGE-USD', 'DOGEUSD': 'DOGE-USD', 'DOGE': 'DOGE-USD',
    }
    coinbase_symbol = coinbase_map.get(symbol_upper)
    if coinbase_symbol:
        try:
            url = f"https://api.coinbase.com/v2/prices/{coinbase_symbol}/spot"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                price = float(data.get('data', {}).get('amount', 0))
                if price > 0:
                    logger.info(f"Coinbase price for {symbol}: {price}")
                    return price
            else:
                logger.warning(f"Coinbase API returned status {resp.status_code}")
        except Exception as e:
            logger.warning(f"Coinbase fetch failed for {symbol}: {e}")

    # Fallback to CoinGecko (may be rate limited)
    coin_map = {
        'BTC-USD': 'bitcoin', 'BTCUSD': 'bitcoin', 'BTC': 'bitcoin',
        'ETH-USD': 'ethereum', 'ETHUSD': 'ethereum', 'ETH': 'ethereum',
        'SOL-USD': 'solana', 'SOLUSD': 'solana', 'SOL': 'solana',
        'XRP-USD': 'ripple', 'XRPUSD': 'ripple', 'XRP': 'ripple',
        'ADA-USD': 'cardano', 'ADAUSD': 'cardano', 'ADA': 'cardano',
        'DOGE-USD': 'dogecoin', 'DOGEUSD': 'dogecoin', 'DOGE': 'dogecoin',
    }

    coin_id = coin_map.get(symbol_upper)
    if coin_id:
        try:
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                price = data.get(coin_id, {}).get('usd')
                if price:
                    logger.info(f"CoinGecko price for {symbol}: {price}")
                    return float(price)
            else:
                logger.warning(f"CoinGecko API returned status {resp.status_code}")
        except Exception as e:
            logger.warning(f"CoinGecko fetch failed for {symbol}: {e}")

    logger.warning(f"No price found for {symbol} from any API")
    return None


def _get_price_with_fallbacks(symbol: str) -> float | None:
    """Get price using all available fallbacks (convenience function)"""
    # Try live price data first (background updater)
    live_data = get_live_price_data(symbol)
    if live_data:
        price = live_data.get('price')
        if price:
            return price

    # Fallback to yfinance
    price = get_current_price(symbol)
    if price:
        return price

    # Last resort: Direct Binance/CoinGecko
    return _fetch_crypto_price_direct(symbol)


@trades_bp.route('', methods=['GET'])
@jwt_required()
def get_trades():
    """Get all trades for user's active challenge"""
    current_user_id = int(get_jwt_identity())

    # Get challenge_id from query params or find active challenge
    challenge_id = request.args.get('challenge_id')

    if challenge_id:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge or challenge.user_id != current_user_id:
            return jsonify({'error': 'Challenge not found'}), 404
    else:
        challenge = UserChallenge.query.filter_by(
            user_id=current_user_id,
            status='active'
        ).first()
        if not challenge:
            return jsonify({'error': 'No active challenge'}), 404

    trades = Trade.query.filter_by(challenge_id=challenge.id).order_by(
        Trade.opened_at.desc()
    ).all()

    return jsonify({
        'trades': [t.to_dict() for t in trades],
        'challenge_id': challenge.id
    }), 200


@trades_bp.route('/open', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def open_trade():
    """Open a new trade"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    required_fields = ['symbol', 'trade_type', 'quantity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge. Please purchase a plan first.'}), 404

    # Get current price - try multiple sources
    symbol = data['symbol']
    logger.info(f"=== PRICE FETCH START for {symbol} ===")

    current_price = None
    price_source = None
    debug_info = {'symbol': symbol, 'attempts': []}

    # Try live price data first (Binance/background updater - fastest)
    logger.info(f"[1/4] Trying live price data for {symbol}...")
    try:
        live_data = get_live_price_data(symbol)
        if live_data:
            current_price = live_data.get('price')
            if current_price:
                price_source = "live_updater"
                debug_info['attempts'].append({'source': 'live_updater', 'success': True, 'price': current_price})
                logger.info(f"[1/4] SUCCESS - Live price for {symbol}: {current_price}")
            else:
                debug_info['attempts'].append({'source': 'live_updater', 'success': False, 'reason': 'no price in data'})
                logger.warning(f"[1/4] Live data exists but no price for {symbol}")
        else:
            debug_info['attempts'].append({'source': 'live_updater', 'success': False, 'reason': 'no live data'})
            logger.warning(f"[1/4] FAILED - No live data for {symbol}")
    except Exception as e:
        debug_info['attempts'].append({'source': 'live_updater', 'success': False, 'reason': str(e)})
        logger.error(f"[1/4] ERROR - Live data exception: {e}")

    # Fallback to yfinance if no live price
    if current_price is None:
        logger.info(f"[2/4] Trying yfinance/get_current_price for {symbol}...")
        try:
            current_price = get_current_price(symbol)
            if current_price:
                price_source = "yfinance"
                debug_info['attempts'].append({'source': 'yfinance', 'success': True, 'price': current_price})
                logger.info(f"[2/4] SUCCESS - YFinance price for {symbol}: {current_price}")
            else:
                debug_info['attempts'].append({'source': 'yfinance', 'success': False, 'reason': 'returned None'})
                logger.warning(f"[2/4] FAILED - YFinance returned None for {symbol}")
        except Exception as e:
            debug_info['attempts'].append({'source': 'yfinance', 'success': False, 'reason': str(e)})
            logger.error(f"[2/4] ERROR - YFinance exception: {e}")

    # Fallback: Direct Binance/CoinGecko fetch for crypto
    if current_price is None:
        logger.info(f"[3/4] Trying direct API (Binance/CoinGecko) for {symbol}...")
        try:
            current_price = _fetch_crypto_price_direct(symbol)
            if current_price:
                price_source = "direct_api"
                debug_info['attempts'].append({'source': 'direct_api', 'success': True, 'price': current_price})
                logger.info(f"[3/4] SUCCESS - Direct API price for {symbol}: {current_price}")
            else:
                debug_info['attempts'].append({'source': 'direct_api', 'success': False, 'reason': 'returned None'})
                logger.error(f"[3/4] FAILED - Direct API returned None for {symbol}")
        except Exception as e:
            debug_info['attempts'].append({'source': 'direct_api', 'success': False, 'reason': str(e)})
            logger.error(f"[3/4] ERROR - Direct API exception: {e}")

    # LAST RESORT: Use static reference prices for major crypto (for testing)
    if current_price is None:
        logger.info(f"[4/4] Using static reference price as last resort for {symbol}...")
        static_prices = {
            'BTC-USD': 95000.0, 'BTCUSD': 95000.0,
            'ETH-USD': 3400.0, 'ETHUSD': 3400.0,
            'SOL-USD': 190.0, 'SOLUSD': 190.0,
            'XRP-USD': 2.30, 'XRPUSD': 2.30,
            'ADA-USD': 1.0, 'ADAUSD': 1.0,
            'DOGE-USD': 0.35, 'DOGEUSD': 0.35,
            'AAPL': 230.0, 'TSLA': 400.0, 'GOOGL': 190.0, 'MSFT': 420.0, 'NVDA': 140.0,
        }
        current_price = static_prices.get(symbol.upper())
        if current_price:
            price_source = "static_fallback"
            debug_info['attempts'].append({'source': 'static_fallback', 'success': True, 'price': current_price})
            logger.warning(f"[4/4] Using STATIC price for {symbol}: {current_price} (APIs unavailable)")
        else:
            debug_info['attempts'].append({'source': 'static_fallback', 'success': False, 'reason': 'symbol not in static list'})

    if current_price is None:
        logger.error(f"=== PRICE FETCH FAILED for {symbol} - ALL 4 SOURCES FAILED ===")
        return jsonify({
            'error': f'Could not get price for {symbol}. The market may be closed or the symbol is invalid.',
            'debug': debug_info
        }), 400

    logger.info(f"=== PRICE FETCH SUCCESS for {symbol}: ${current_price} (source: {price_source}) ===")

    quantity = Decimal(str(data['quantity']))
    trade_value = quantity * Decimal(str(current_price))

    # Check if user has enough balance
    if trade_value > challenge.current_balance:
        return jsonify({
            'error': 'Insufficient balance',
            'required': float(trade_value),
            'available': float(challenge.current_balance)
        }), 400

    # Create trade
    trade = Trade(
        challenge_id=challenge.id,
        symbol=symbol,
        trade_type=data['trade_type'],
        quantity=quantity,
        entry_price=Decimal(str(current_price)),
        stop_loss=Decimal(str(data['stop_loss'])) if data.get('stop_loss') else None,
        take_profit=Decimal(str(data['take_profit'])) if data.get('take_profit') else None,
        status='open'
    )

    db.session.add(trade)
    db.session.commit()

    # Log trade open
    try:
        user = User.query.get(current_user_id)
        AuditService.log_trade_open(
            user_id=current_user_id,
            username=user.username if user else None,
            trade_id=trade.id,
            symbol=symbol,
            trade_type=data['trade_type'],
            quantity=quantity,
            price=current_price
        )
    except Exception as e:
        logger.warning(f"Failed to log trade open audit: {e}")

    return jsonify({
        'message': 'Trade opened successfully',
        'trade': trade.to_dict(),
        'current_price': current_price
    }), 201


@trades_bp.route('/<int:trade_id>/close', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def close_trade(trade_id):
    """Close an open trade"""
    current_user_id = int(get_jwt_identity())
    trade = Trade.query.get(trade_id)

    if not trade:
        return jsonify({'error': 'Trade not found'}), 404

    challenge = UserChallenge.query.get(trade.challenge_id)
    if challenge.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if trade.status != 'open':
        return jsonify({'error': 'Trade is already closed'}), 400

    # Get current price - try multiple sources (same as open_trade)
    symbol = trade.symbol
    current_price = None

    # Try live price data first
    live_data = get_live_price_data(symbol)
    if live_data:
        current_price = live_data.get('price')

    # Fallback to yfinance
    if current_price is None:
        current_price = get_current_price(symbol)

    # Last resort: Direct Binance/CoinGecko
    if current_price is None:
        current_price = _fetch_crypto_price_direct(symbol)

    if current_price is None:
        logger.error(f"Failed to get price for {symbol} to close trade")
        return jsonify({'error': f'Could not get price for {symbol}'}), 400

    # Close trade and calculate PnL
    pnl = trade.close_trade(current_price)

    # Update challenge balance (preserve decimal precision)
    challenge.current_balance = challenge.current_balance + Decimal(str(pnl))

    # Update highest balance if applicable
    if challenge.current_balance > challenge.highest_balance:
        challenge.highest_balance = challenge.current_balance

    db.session.commit()

    # Log trade close
    try:
        user = User.query.get(current_user_id)
        AuditService.log_trade_close(
            user_id=current_user_id,
            username=user.username if user else None,
            trade_id=trade.id,
            symbol=trade.symbol,
            profit_loss=pnl
        )
    except Exception as e:
        logger.warning(f"Failed to log trade close audit: {e}")

    # Evaluate challenge rules
    engine = ChallengeEngine()
    evaluation_result = engine.evaluate_challenge(challenge)

    return jsonify({
        'message': 'Trade closed successfully',
        'trade': trade.to_dict(),
        'pnl': pnl,
        'current_price': current_price,
        'new_balance': float(challenge.current_balance),
        'challenge_status': evaluation_result
    }), 200


@trades_bp.route('/<int:trade_id>', methods=['GET'])
@jwt_required()
def get_trade(trade_id):
    """Get specific trade details"""
    current_user_id = int(get_jwt_identity())
    trade = Trade.query.get(trade_id)

    if not trade:
        return jsonify({'error': 'Trade not found'}), 404

    challenge = UserChallenge.query.get(trade.challenge_id)
    user = User.query.get(current_user_id)

    if challenge.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get current price for open trades
    response_data = {'trade': trade.to_dict()}

    if trade.status == 'open':
        current_price = _get_price_with_fallbacks(trade.symbol)
        if current_price:
            # Calculate unrealized PnL
            if trade.trade_type == 'buy':
                unrealized_pnl = (current_price - float(trade.entry_price)) * float(trade.quantity)
            else:
                unrealized_pnl = (float(trade.entry_price) - current_price) * float(trade.quantity)

            response_data['current_price'] = current_price
            response_data['unrealized_pnl'] = unrealized_pnl

    return jsonify(response_data), 200


@trades_bp.route('/open/pnl', methods=['GET'])
@jwt_required()
def get_open_trades_pnl():
    """Get real-time PnL for all open trades"""
    current_user_id = int(get_jwt_identity())

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge'}), 404

    # Get all open trades
    open_trades = Trade.query.filter_by(
        challenge_id=challenge.id,
        status='open'
    ).all()

    trades_pnl = []
    total_unrealized_pnl = 0
    total_value = 0
    price_errors = []

    for trade in open_trades:
        current_price = _get_price_with_fallbacks(trade.symbol)
        price_available = current_price is not None

        # IMPORTANT: Always include trade, use entry price as fallback
        if not price_available:
            current_price = float(trade.entry_price)
            price_errors.append(trade.symbol)
            logger.warning(f"Price unavailable for {trade.symbol}, using entry price as fallback")

        # Calculate unrealized PnL
        entry_price = float(trade.entry_price)
        quantity = float(trade.quantity)

        if trade.trade_type == 'buy':
            unrealized_pnl = (current_price - entry_price) * quantity
        else:
            unrealized_pnl = (entry_price - current_price) * quantity

        trade_value = entry_price * quantity
        pnl_percent = (unrealized_pnl / trade_value) * 100 if trade_value > 0 else 0
        current_value = current_price * quantity

        trades_pnl.append({
            'trade_id': trade.id,
            'symbol': trade.symbol,
            'trade_type': trade.trade_type,
            'quantity': quantity,
            'entry_price': entry_price,
            'current_price': current_price,
            'unrealized_pnl': round(unrealized_pnl, 2),
            'pnl_percent': round(pnl_percent, 2),
            'current_value': round(current_value, 2),
            'price_available': price_available
        })

        total_unrealized_pnl += unrealized_pnl
        total_value += current_value

    return jsonify({
        'trades': trades_pnl,
        'total_unrealized_pnl': round(total_unrealized_pnl, 2),
        'total_value': round(total_value, 2),
        'current_balance': float(challenge.current_balance),
        'effective_balance': round(float(challenge.current_balance) + total_unrealized_pnl, 2),
        'price_errors': price_errors if price_errors else None
    }), 200
