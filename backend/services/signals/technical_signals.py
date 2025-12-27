"""
Technical Analysis Signals Service
Calculates RSI, MACD, Bollinger Bands, Moving Averages, and composite signals
"""

import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import math

# Singleton instance
_technical_service = None
_service_lock = threading.Lock()


def get_technical_service():
    """Get singleton instance of TechnicalSignalsService"""
    global _technical_service
    if _technical_service is None:
        with _service_lock:
            if _technical_service is None:
                _technical_service = TechnicalSignalsService()
    return _technical_service


class TechnicalSignalsService:
    """
    Technical Analysis service that calculates indicators without external dependencies.
    Uses pure Python implementations for RSI, MACD, Bollinger Bands, and Moving Averages.
    """

    def __init__(self):
        self._cache = {}
        self._cache_duration = 60  # 1 minute cache

    def calculate_sma(self, prices: List[float], period: int) -> List[float]:
        """Calculate Simple Moving Average"""
        if len(prices) < period:
            return []

        sma = []
        for i in range(period - 1, len(prices)):
            window = prices[i - period + 1:i + 1]
            sma.append(sum(window) / period)
        return sma

    def calculate_ema(self, prices: List[float], period: int) -> List[float]:
        """Calculate Exponential Moving Average"""
        if len(prices) < period:
            return []

        multiplier = 2 / (period + 1)
        ema = [sum(prices[:period]) / period]  # Start with SMA

        for i in range(period, len(prices)):
            ema.append((prices[i] - ema[-1]) * multiplier + ema[-1])

        return ema

    def calculate_rsi(self, prices: List[float], period: int = 14) -> Dict:
        """
        Calculate Relative Strength Index
        Returns: {'value': float, 'signal': str, 'zone': str}
        """
        if len(prices) < period + 1:
            return {'value': 50.0, 'signal': 'neutral', 'zone': 'neutral'}

        # Calculate price changes
        changes = [prices[i] - prices[i-1] for i in range(1, len(prices))]

        # Separate gains and losses
        gains = [max(0, c) for c in changes]
        losses = [abs(min(0, c)) for c in changes]

        # Calculate initial average gain/loss
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        # Calculate smoothed averages for remaining periods
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        # Calculate RSI
        if avg_loss == 0:
            rsi = 100.0
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))

        # Determine signal and zone
        if rsi >= 70:
            signal = 'overbought'
            zone = 'sell'
        elif rsi <= 30:
            signal = 'oversold'
            zone = 'buy'
        elif rsi >= 60:
            signal = 'bullish'
            zone = 'neutral'
        elif rsi <= 40:
            signal = 'bearish'
            zone = 'neutral'
        else:
            signal = 'neutral'
            zone = 'neutral'

        return {
            'value': round(rsi, 2),
            'signal': signal,
            'zone': zone,
            'description': f'RSI at {rsi:.1f} - {signal.capitalize()}'
        }

    def calculate_macd(self, prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict:
        """
        Calculate MACD (Moving Average Convergence Divergence)
        Returns: {'macd': float, 'signal': float, 'histogram': float, 'trend': str}
        """
        if len(prices) < slow + signal:
            return {
                'macd': 0.0,
                'signal_line': 0.0,
                'histogram': 0.0,
                'trend': 'neutral',
                'crossover': None
            }

        # Calculate EMAs
        ema_fast = self.calculate_ema(prices, fast)
        ema_slow = self.calculate_ema(prices, slow)

        # MACD line = Fast EMA - Slow EMA
        # Align arrays (slow EMA starts later)
        offset = slow - fast
        macd_line = []
        for i in range(len(ema_slow)):
            macd_line.append(ema_fast[i + offset] - ema_slow[i])

        # Signal line = 9-period EMA of MACD
        if len(macd_line) >= signal:
            signal_ema = self.calculate_ema(macd_line, signal)
            signal_line = signal_ema[-1] if signal_ema else 0
            macd_value = macd_line[-1]
            histogram = macd_value - signal_line

            # Previous values for crossover detection
            prev_macd = macd_line[-2] if len(macd_line) > 1 else macd_value
            prev_signal = signal_ema[-2] if len(signal_ema) > 1 else signal_line

            # Detect crossover
            crossover = None
            if prev_macd <= prev_signal and macd_value > signal_line:
                crossover = 'bullish'
            elif prev_macd >= prev_signal and macd_value < signal_line:
                crossover = 'bearish'

            # Determine trend
            if histogram > 0 and macd_value > 0:
                trend = 'strong_bullish'
            elif histogram > 0:
                trend = 'bullish'
            elif histogram < 0 and macd_value < 0:
                trend = 'strong_bearish'
            elif histogram < 0:
                trend = 'bearish'
            else:
                trend = 'neutral'
        else:
            macd_value = macd_line[-1] if macd_line else 0
            signal_line = 0
            histogram = 0
            trend = 'neutral'
            crossover = None

        return {
            'macd': round(macd_value, 4),
            'signal_line': round(signal_line, 4),
            'histogram': round(histogram, 4),
            'trend': trend,
            'crossover': crossover,
            'description': f'MACD {trend.replace("_", " ").capitalize()}'
            + (f' - {crossover.capitalize()} crossover!' if crossover else '')
        }

    def calculate_bollinger_bands(self, prices: List[float], period: int = 20, std_dev: float = 2.0) -> Dict:
        """
        Calculate Bollinger Bands
        Returns: {'upper': float, 'middle': float, 'lower': float, 'width': float, 'position': str}
        """
        if len(prices) < period:
            return {
                'upper': 0.0,
                'middle': 0.0,
                'lower': 0.0,
                'width': 0.0,
                'position': 'neutral',
                'percent_b': 50.0
            }

        # Calculate SMA (middle band)
        sma = self.calculate_sma(prices, period)
        middle = sma[-1]

        # Calculate standard deviation
        window = prices[-period:]
        variance = sum((p - middle) ** 2 for p in window) / period
        std = math.sqrt(variance)

        # Calculate bands
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        width = ((upper - lower) / middle) * 100 if middle > 0 else 0

        # Current price position
        current_price = prices[-1]

        # %B indicator (position within bands)
        if upper != lower:
            percent_b = ((current_price - lower) / (upper - lower)) * 100
        else:
            percent_b = 50.0

        # Determine position
        if current_price >= upper:
            position = 'above_upper'
            signal = 'overbought'
        elif current_price <= lower:
            position = 'below_lower'
            signal = 'oversold'
        elif current_price > middle:
            position = 'upper_half'
            signal = 'bullish'
        elif current_price < middle:
            position = 'lower_half'
            signal = 'bearish'
        else:
            position = 'middle'
            signal = 'neutral'

        return {
            'upper': round(upper, 4),
            'middle': round(middle, 4),
            'lower': round(lower, 4),
            'width': round(width, 2),
            'percent_b': round(percent_b, 2),
            'position': position,
            'signal': signal,
            'description': f'Price at {percent_b:.0f}% of bands - {signal.capitalize()}'
        }

    def calculate_moving_averages(self, prices: List[float]) -> Dict:
        """
        Calculate multiple moving averages and crossover signals
        Returns: {'sma_20': float, 'sma_50': float, 'ema_12': float, 'ema_26': float, 'trend': str}
        """
        result = {
            'sma_20': None,
            'sma_50': None,
            'sma_200': None,
            'ema_12': None,
            'ema_26': None,
            'trend': 'neutral',
            'crossovers': []
        }

        current_price = prices[-1] if prices else 0

        # Calculate SMAs
        if len(prices) >= 20:
            sma_20 = self.calculate_sma(prices, 20)
            result['sma_20'] = round(sma_20[-1], 4) if sma_20 else None

        if len(prices) >= 50:
            sma_50 = self.calculate_sma(prices, 50)
            result['sma_50'] = round(sma_50[-1], 4) if sma_50 else None

        if len(prices) >= 200:
            sma_200 = self.calculate_sma(prices, 200)
            result['sma_200'] = round(sma_200[-1], 4) if sma_200 else None

        # Calculate EMAs
        if len(prices) >= 12:
            ema_12 = self.calculate_ema(prices, 12)
            result['ema_12'] = round(ema_12[-1], 4) if ema_12 else None

        if len(prices) >= 26:
            ema_26 = self.calculate_ema(prices, 26)
            result['ema_26'] = round(ema_26[-1], 4) if ema_26 else None

        # Determine trend based on price vs MAs
        bullish_count = 0
        bearish_count = 0

        if result['sma_20'] and current_price > result['sma_20']:
            bullish_count += 1
        elif result['sma_20']:
            bearish_count += 1

        if result['sma_50'] and current_price > result['sma_50']:
            bullish_count += 1
        elif result['sma_50']:
            bearish_count += 1

        if result['ema_12'] and result['ema_26']:
            if result['ema_12'] > result['ema_26']:
                bullish_count += 2
                result['crossovers'].append('EMA 12/26 bullish')
            else:
                bearish_count += 2
                result['crossovers'].append('EMA 12/26 bearish')

        # Golden cross / Death cross detection
        if result['sma_50'] and result['sma_200']:
            if result['sma_50'] > result['sma_200']:
                result['crossovers'].append('Golden Cross (SMA 50 > 200)')
                bullish_count += 3
            else:
                result['crossovers'].append('Death Cross (SMA 50 < 200)')
                bearish_count += 3

        # Determine overall trend
        if bullish_count - bearish_count >= 4:
            result['trend'] = 'strong_bullish'
        elif bullish_count - bearish_count >= 2:
            result['trend'] = 'bullish'
        elif bearish_count - bullish_count >= 4:
            result['trend'] = 'strong_bearish'
        elif bearish_count - bullish_count >= 2:
            result['trend'] = 'bearish'
        else:
            result['trend'] = 'neutral'

        result['description'] = f'MA trend: {result["trend"].replace("_", " ").capitalize()}'

        return result

    def calculate_support_resistance(self, prices: List[float], period: int = 20) -> Dict:
        """
        Calculate support and resistance levels using recent highs/lows
        """
        if len(prices) < period:
            return {
                'support': [],
                'resistance': [],
                'nearest_support': None,
                'nearest_resistance': None
            }

        recent_prices = prices[-period:]
        current_price = prices[-1]

        # Find local minima (support) and maxima (resistance)
        supports = []
        resistances = []

        for i in range(1, len(recent_prices) - 1):
            # Local minimum
            if recent_prices[i] < recent_prices[i-1] and recent_prices[i] < recent_prices[i+1]:
                supports.append(recent_prices[i])
            # Local maximum
            if recent_prices[i] > recent_prices[i-1] and recent_prices[i] > recent_prices[i+1]:
                resistances.append(recent_prices[i])

        # Add period high/low as major levels
        period_high = max(recent_prices)
        period_low = min(recent_prices)

        if period_low not in supports:
            supports.append(period_low)
        if period_high not in resistances:
            resistances.append(period_high)

        # Sort levels
        supports = sorted(set(supports))
        resistances = sorted(set(resistances))

        # Find nearest levels
        supports_below = [s for s in supports if s < current_price]
        resistances_above = [r for r in resistances if r > current_price]

        nearest_support = max(supports_below) if supports_below else None
        nearest_resistance = min(resistances_above) if resistances_above else None

        return {
            'support': [round(s, 4) for s in supports[-3:]],  # Last 3 levels
            'resistance': [round(r, 4) for r in resistances[-3:]],
            'nearest_support': round(nearest_support, 4) if nearest_support else None,
            'nearest_resistance': round(nearest_resistance, 4) if nearest_resistance else None,
            'period_high': round(period_high, 4),
            'period_low': round(period_low, 4)
        }

    def calculate_composite_score(self, prices: List[float]) -> Dict:
        """
        Calculate composite technical score combining all indicators
        Returns: {'score': -100 to +100, 'signal': str, 'indicators': dict}
        """
        if len(prices) < 26:
            return {
                'score': 0,
                'signal': 'insufficient_data',
                'confidence': 0,
                'indicators': {},
                'reasons': ['Insufficient price data for analysis']
            }

        score = 0
        reasons = []
        max_score = 100

        # Calculate all indicators
        rsi = self.calculate_rsi(prices)
        macd = self.calculate_macd(prices)
        bb = self.calculate_bollinger_bands(prices)
        ma = self.calculate_moving_averages(prices)
        sr = self.calculate_support_resistance(prices)

        # RSI contribution (max +/- 25 points)
        if rsi['zone'] == 'buy':
            score += 25
            reasons.append(f"RSI oversold at {rsi['value']:.1f}")
        elif rsi['zone'] == 'sell':
            score -= 25
            reasons.append(f"RSI overbought at {rsi['value']:.1f}")
        elif rsi['signal'] == 'bullish':
            score += 10
        elif rsi['signal'] == 'bearish':
            score -= 10

        # MACD contribution (max +/- 30 points)
        if macd['crossover'] == 'bullish':
            score += 30
            reasons.append("MACD bullish crossover")
        elif macd['crossover'] == 'bearish':
            score -= 30
            reasons.append("MACD bearish crossover")
        elif macd['trend'] == 'strong_bullish':
            score += 20
            reasons.append("Strong bullish MACD momentum")
        elif macd['trend'] == 'strong_bearish':
            score -= 20
            reasons.append("Strong bearish MACD momentum")
        elif macd['trend'] == 'bullish':
            score += 10
        elif macd['trend'] == 'bearish':
            score -= 10

        # Bollinger Bands contribution (max +/- 20 points)
        if bb['signal'] == 'oversold':
            score += 20
            reasons.append(f"Price at lower Bollinger Band ({bb['percent_b']:.0f}%)")
        elif bb['signal'] == 'overbought':
            score -= 20
            reasons.append(f"Price at upper Bollinger Band ({bb['percent_b']:.0f}%)")
        elif bb['signal'] == 'bullish':
            score += 5
        elif bb['signal'] == 'bearish':
            score -= 5

        # Moving Averages contribution (max +/- 25 points)
        if ma['trend'] == 'strong_bullish':
            score += 25
            reasons.append("Strong bullish MA alignment")
        elif ma['trend'] == 'strong_bearish':
            score -= 25
            reasons.append("Strong bearish MA alignment")
        elif ma['trend'] == 'bullish':
            score += 15
            reasons.append("Bullish MA trend")
        elif ma['trend'] == 'bearish':
            score -= 15
            reasons.append("Bearish MA trend")

        # Add Golden/Death cross
        if 'Golden Cross' in str(ma.get('crossovers', [])):
            reasons.append("Golden Cross detected")
        elif 'Death Cross' in str(ma.get('crossovers', [])):
            reasons.append("Death Cross detected")

        # Clamp score
        score = max(-100, min(100, score))

        # Determine signal
        if score >= 50:
            signal = 'strong_buy'
        elif score >= 20:
            signal = 'buy'
        elif score <= -50:
            signal = 'strong_sell'
        elif score <= -20:
            signal = 'sell'
        else:
            signal = 'hold'

        # Calculate confidence (how many indicators agree)
        confidence = min(100, abs(score) + 20)

        return {
            'score': score,
            'signal': signal,
            'confidence': confidence,
            'indicators': {
                'rsi': rsi,
                'macd': macd,
                'bollinger': bb,
                'moving_averages': ma,
                'support_resistance': sr
            },
            'reasons': reasons[:5],  # Top 5 reasons
            'timestamp': datetime.now().isoformat()
        }

    def get_signal_for_symbol(self, symbol: str, prices: List[float], current_price: float = None) -> Dict:
        """
        Get complete technical analysis for a symbol
        """
        if not prices:
            return {
                'symbol': symbol,
                'error': 'No price data available',
                'signal': 'hold',
                'score': 0
            }

        current = current_price or prices[-1]
        analysis = self.calculate_composite_score(prices)

        # Calculate entry, stop loss, take profit based on signal
        if analysis['signal'] in ['buy', 'strong_buy']:
            entry = current
            stop_loss = round(current * 0.95, 4)  # 5% below
            take_profit = round(current * 1.10, 4)  # 10% above

            # Adjust based on support/resistance if available
            sr = analysis['indicators'].get('support_resistance', {})
            if sr.get('nearest_support'):
                stop_loss = round(sr['nearest_support'] * 0.99, 4)
            if sr.get('nearest_resistance'):
                take_profit = sr['nearest_resistance']
        elif analysis['signal'] in ['sell', 'strong_sell']:
            entry = current
            stop_loss = round(current * 1.05, 4)  # 5% above
            take_profit = round(current * 0.90, 4)  # 10% below

            sr = analysis['indicators'].get('support_resistance', {})
            if sr.get('nearest_resistance'):
                stop_loss = round(sr['nearest_resistance'] * 1.01, 4)
            if sr.get('nearest_support'):
                take_profit = sr['nearest_support']
        else:
            entry = None
            stop_loss = None
            take_profit = None

        return {
            'symbol': symbol,
            'current_price': current,
            'signal': analysis['signal'],
            'score': analysis['score'],
            'confidence': analysis['confidence'],
            'entry_price': entry,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'risk_reward': round(abs(take_profit - entry) / abs(entry - stop_loss), 2) if entry and stop_loss and take_profit and entry != stop_loss else None,
            'indicators': analysis['indicators'],
            'reasons': analysis['reasons'],
            'timestamp': analysis['timestamp']
        }
