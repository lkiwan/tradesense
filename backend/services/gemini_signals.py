"""
Gemini AI Trading Signals Service
Uses Google's Gemini API to generate trading signals based on market data
"""

import os
import json
import threading
from datetime import datetime, timedelta
import google.generativeai as genai
from models import Settings

# Configure Gemini
_gemini_configured = False

# Signal cache to reduce API calls
_signal_cache = {}
_cache_lock = threading.Lock()
SIGNAL_CACHE_DURATION = 300  # 5 minutes


def _get_cached_signal(symbol: str) -> dict | None:
    """Get cached signal if still valid"""
    with _cache_lock:
        if symbol in _signal_cache:
            cached = _signal_cache[symbol]
            if datetime.now() - cached['cached_at'] < timedelta(seconds=SIGNAL_CACHE_DURATION):
                return cached['signal']
    return None


def _cache_signal(symbol: str, signal: dict) -> None:
    """Cache a signal"""
    with _cache_lock:
        _signal_cache[symbol] = {
            'signal': signal,
            'cached_at': datetime.now()
        }


def clear_signal_cache(symbol: str = None) -> None:
    """Clear signal cache for a symbol or all symbols"""
    with _cache_lock:
        if symbol:
            _signal_cache.pop(symbol, None)
        else:
            _signal_cache.clear()


def _configure_gemini():
    """Configure Gemini API with key from settings or environment"""
    global _gemini_configured

    if _gemini_configured:
        return True

    # Try to get API key from database settings first
    try:
        api_key = Settings.get_setting('gemini_api_key')
    except Exception:
        api_key = None

    # Fallback to environment variable
    if not api_key:
        api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        print("Warning: Gemini API key not configured for signals")
        return False

    try:
        genai.configure(api_key=api_key)
        _gemini_configured = True
        print(f"Gemini signals configured with key ending in ...{api_key[-4:]}")
        return True
    except Exception as e:
        print(f"Error configuring Gemini for signals: {e}")
        return False


def get_ai_signal(symbol: str, current_price: float, change_percent: float,
                  volume: float = None, historical_data: list = None,
                  force_refresh: bool = False) -> dict:
    """
    Get AI-generated trading signal for a symbol

    Returns:
    {
        'signal': 'BUY' | 'SELL' | 'HOLD',
        'confidence': 0-100,
        'reason': str,
        'entry_price': float (optional),
        'stop_loss': float (optional),
        'take_profit': float (optional)
    }
    """
    # Check cache first (unless force refresh)
    if not force_refresh:
        cached = _get_cached_signal(symbol)
        if cached:
            cached['from_cache'] = True
            return cached

    if not _configure_gemini():
        signal = _generate_technical_signal(symbol, current_price, change_percent)
        _cache_signal(symbol, signal)
        return signal

    try:
        # Use the latest Gemini model (same as ai_chat.py)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Build context
        context = f"""
        Analyze this trading opportunity and provide a signal:

        Symbol: {symbol}
        Current Price: ${current_price:.4f}
        Daily Change: {change_percent:.2f}%
        {"Volume: " + str(volume) if volume else ""}
        Analysis Time: {datetime.now().strftime("%Y-%m-%d %H:%M")}

        Based on this data, provide a trading signal in the following JSON format:
        {{
            "signal": "BUY" or "SELL" or "HOLD",
            "confidence": 1-100,
            "reason": "Brief explanation (max 100 chars)",
            "entry_price": suggested entry price,
            "stop_loss": suggested stop loss price,
            "take_profit": suggested take profit price
        }}

        Consider:
        - Current price momentum ({change_percent}% change)
        - Risk/reward ratio
        - Market conditions

        Respond with ONLY the JSON, no other text.
        """

        response = model.generate_content(context)
        response_text = response.text.strip()

        # Clean up response (remove markdown if present)
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        response_text = response_text.strip()

        # Parse JSON response
        signal_data = json.loads(response_text)

        # Validate and clean response
        valid_signals = ['BUY', 'SELL', 'HOLD']
        signal = signal_data.get('signal', 'HOLD').upper()
        if signal not in valid_signals:
            signal = 'HOLD'

        confidence = min(100, max(0, int(signal_data.get('confidence', 50))))

        result = {
            'signal': signal,
            'confidence': confidence,
            'reason': signal_data.get('reason', 'AI analysis complete')[:200],
            'entry_price': signal_data.get('entry_price'),
            'stop_loss': signal_data.get('stop_loss'),
            'take_profit': signal_data.get('take_profit'),
            'ai_powered': True,
            'timestamp': datetime.now().isoformat()
        }
        _cache_signal(symbol, result)
        return result

    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response: {e}")
        signal = _generate_technical_signal(symbol, current_price, change_percent)
        _cache_signal(symbol, signal)
        return signal
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        signal = _generate_technical_signal(symbol, current_price, change_percent)
        _cache_signal(symbol, signal)
        return signal


def _generate_technical_signal(symbol: str, current_price: float, change_percent: float) -> dict:
    """
    Generate signal based on simple technical analysis
    Used as fallback when Gemini is not available
    """
    signal = 'HOLD'
    confidence = 50
    reason = 'Based on price momentum analysis'

    # Simple momentum-based signal
    if change_percent > 3:
        signal = 'BUY'
        confidence = 65
        reason = f'Strong upward momentum (+{change_percent:.1f}%)'
    elif change_percent > 1:
        signal = 'BUY'
        confidence = 55
        reason = f'Positive momentum (+{change_percent:.1f}%)'
    elif change_percent < -3:
        signal = 'SELL'
        confidence = 65
        reason = f'Strong downward pressure ({change_percent:.1f}%)'
    elif change_percent < -1:
        signal = 'SELL'
        confidence = 55
        reason = f'Negative momentum ({change_percent:.1f}%)'
    else:
        signal = 'HOLD'
        confidence = 60
        reason = 'Market consolidating, wait for clearer direction'

    # Calculate suggested prices
    if signal == 'BUY':
        entry = current_price
        stop_loss = round(current_price * 0.95, 4)  # 5% below
        take_profit = round(current_price * 1.10, 4)  # 10% above
    elif signal == 'SELL':
        entry = current_price
        stop_loss = round(current_price * 1.05, 4)  # 5% above
        take_profit = round(current_price * 0.90, 4)  # 10% below
    else:
        entry = None
        stop_loss = None
        take_profit = None

    return {
        'signal': signal,
        'confidence': confidence,
        'reason': reason,
        'entry_price': entry,
        'stop_loss': stop_loss,
        'take_profit': take_profit,
        'ai_powered': False,
        'timestamp': datetime.now().isoformat()
    }


def get_market_analysis(symbols: list) -> dict:
    """
    Get overall market analysis for multiple symbols
    """
    if not _configure_gemini():
        return {
            'analysis': 'Gemini AI not configured',
            'sentiment': 'neutral',
            'recommendations': []
        }

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = f"""
        Provide a brief market analysis for these assets: {', '.join(symbols)}

        Return JSON:
        {{
            "analysis": "2-3 sentence market overview",
            "sentiment": "bullish" or "bearish" or "neutral",
            "top_pick": "best symbol to watch",
            "top_pick_reason": "brief reason"
        }}
        """

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean markdown
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        response_text = response_text.strip()

        return json.loads(response_text)

    except Exception as e:
        print(f"Error in market analysis: {e}")
        return {
            'analysis': 'Market analysis temporarily unavailable',
            'sentiment': 'neutral',
            'top_pick': symbols[0] if symbols else None,
            'top_pick_reason': 'Based on default selection'
        }


def get_risk_alert(symbol: str, current_price: float, entry_price: float,
                   position_size: float, account_balance: float) -> dict:
    """
    Generate risk alert for an open position
    """
    # Calculate current PnL
    pnl = (current_price - entry_price) * position_size
    pnl_percent = (pnl / (entry_price * position_size)) * 100
    account_impact = (pnl / account_balance) * 100

    alert_level = 'normal'
    message = 'Position within normal parameters'

    if account_impact < -5:
        alert_level = 'critical'
        message = f'DANGER: Position losing {abs(account_impact):.1f}% of account!'
    elif account_impact < -3:
        alert_level = 'warning'
        message = f'Warning: Significant loss of {abs(account_impact):.1f}% on account'
    elif account_impact < -1:
        alert_level = 'caution'
        message = f'Caution: Position down {abs(pnl_percent):.1f}%'
    elif account_impact > 5:
        alert_level = 'success'
        message = f'Great! Position up {account_impact:.1f}% of account'

    return {
        'alert_level': alert_level,
        'message': message,
        'pnl': round(pnl, 2),
        'pnl_percent': round(pnl_percent, 2),
        'account_impact_percent': round(account_impact, 2),
        'timestamp': datetime.now().isoformat()
    }
