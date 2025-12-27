"""
Signal History Tracker Service
Tracks signal performance and calculates win rates
"""

import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Singleton instance
_signal_tracker = None
_tracker_lock = threading.Lock()


def get_signal_tracker():
    """Get singleton instance of SignalTracker"""
    global _signal_tracker
    if _signal_tracker is None:
        with _tracker_lock:
            if _signal_tracker is None:
                _signal_tracker = SignalTracker()
    return _signal_tracker


class SignalTracker:
    """
    Tracks signal history and performance.
    Stores signals in database and calculates metrics.
    """

    def __init__(self):
        self._db = None
        self._init_db()

    def _init_db(self):
        """Initialize database connection"""
        try:
            from extensions import db
            self._db = db
        except ImportError:
            pass

    def _get_model(self):
        """Get SignalHistory model"""
        try:
            from models import SignalHistory
            return SignalHistory
        except ImportError:
            return None

    def record_signal(
        self,
        symbol: str,
        signal_type: str,
        entry_price: float,
        stop_loss: float = None,
        take_profit: float = None,
        confidence: int = 50,
        source: str = 'technical',
        reasons: List[str] = None,
        user_id: int = None
    ) -> Dict:
        """
        Record a new trading signal
        """
        SignalHistory = self._get_model()
        if not SignalHistory or not self._db:
            # Return mock signal if no database
            return {
                'id': None,
                'symbol': symbol,
                'signal_type': signal_type,
                'entry_price': entry_price,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'confidence': confidence,
                'source': source,
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'mock': True
            }

        try:
            signal = SignalHistory(
                symbol=symbol.upper(),
                signal_type=signal_type.upper(),
                entry_price=entry_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                confidence=confidence,
                source=source,
                reasons=','.join(reasons) if reasons else None,
                user_id=user_id,
                status='active'
            )

            self._db.session.add(signal)
            self._db.session.commit()

            return {
                'id': signal.id,
                'symbol': signal.symbol,
                'signal_type': signal.signal_type,
                'entry_price': float(signal.entry_price),
                'stop_loss': float(signal.stop_loss) if signal.stop_loss else None,
                'take_profit': float(signal.take_profit) if signal.take_profit else None,
                'confidence': signal.confidence,
                'source': signal.source,
                'status': signal.status,
                'created_at': signal.created_at.isoformat()
            }

        except Exception as e:
            if self._db:
                self._db.session.rollback()
            return {
                'error': str(e),
                'symbol': symbol,
                'signal_type': signal_type
            }

    def update_signal_outcome(
        self,
        signal_id: int,
        current_price: float,
        status: str = None
    ) -> Dict:
        """
        Update signal outcome based on current price
        status: 'hit_tp', 'hit_sl', 'expired', 'closed'
        """
        SignalHistory = self._get_model()
        if not SignalHistory or not self._db:
            return {'error': 'Database not available'}

        try:
            signal = SignalHistory.query.get(signal_id)
            if not signal:
                return {'error': 'Signal not found'}

            # Auto-detect outcome if not specified
            if not status:
                if signal.take_profit and current_price >= signal.take_profit:
                    if signal.signal_type == 'BUY':
                        status = 'hit_tp'
                    else:
                        status = 'hit_sl'
                elif signal.stop_loss and current_price <= signal.stop_loss:
                    if signal.signal_type == 'BUY':
                        status = 'hit_sl'
                    else:
                        status = 'hit_tp'
                else:
                    status = 'active'

            # Calculate PnL
            if signal.signal_type == 'BUY':
                pnl_percent = ((current_price - float(signal.entry_price)) / float(signal.entry_price)) * 100
            else:
                pnl_percent = ((float(signal.entry_price) - current_price) / float(signal.entry_price)) * 100

            signal.status = status
            signal.exit_price = current_price
            signal.pnl_percent = round(pnl_percent, 2)
            signal.closed_at = datetime.now() if status != 'active' else None

            self._db.session.commit()

            return {
                'id': signal.id,
                'symbol': signal.symbol,
                'status': signal.status,
                'entry_price': float(signal.entry_price),
                'exit_price': float(signal.exit_price),
                'pnl_percent': signal.pnl_percent,
                'closed_at': signal.closed_at.isoformat() if signal.closed_at else None
            }

        except Exception as e:
            if self._db:
                self._db.session.rollback()
            return {'error': str(e)}

    def get_performance_stats(self, user_id: int = None, days: int = 30) -> Dict:
        """
        Get signal performance statistics
        """
        SignalHistory = self._get_model()
        if not SignalHistory or not self._db:
            # Return mock stats
            return self._mock_stats()

        try:
            from sqlalchemy import func

            cutoff = datetime.now() - timedelta(days=days)

            query = SignalHistory.query.filter(
                SignalHistory.created_at >= cutoff
            )

            if user_id:
                query = query.filter(SignalHistory.user_id == user_id)

            signals = query.all()

            if not signals:
                return self._mock_stats()

            total = len(signals)
            wins = sum(1 for s in signals if s.status == 'hit_tp')
            losses = sum(1 for s in signals if s.status == 'hit_sl')
            active = sum(1 for s in signals if s.status == 'active')

            # Calculate profits
            total_pnl = sum(s.pnl_percent or 0 for s in signals if s.pnl_percent)
            avg_win = 0
            avg_loss = 0

            winning_signals = [s for s in signals if s.status == 'hit_tp' and s.pnl_percent]
            losing_signals = [s for s in signals if s.status == 'hit_sl' and s.pnl_percent]

            if winning_signals:
                avg_win = sum(s.pnl_percent for s in winning_signals) / len(winning_signals)
            if losing_signals:
                avg_loss = sum(abs(s.pnl_percent) for s in losing_signals) / len(losing_signals)

            # Win rate
            closed_signals = wins + losses
            win_rate = (wins / closed_signals * 100) if closed_signals > 0 else 0

            # Profit factor
            gross_profit = sum(s.pnl_percent for s in signals if s.pnl_percent and s.pnl_percent > 0)
            gross_loss = abs(sum(s.pnl_percent for s in signals if s.pnl_percent and s.pnl_percent < 0))
            profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else gross_profit

            # Best and worst signals
            sorted_signals = sorted(
                [s for s in signals if s.pnl_percent],
                key=lambda x: x.pnl_percent,
                reverse=True
            )

            best_signal = None
            worst_signal = None
            if sorted_signals:
                best = sorted_signals[0]
                best_signal = {
                    'symbol': best.symbol,
                    'pnl_percent': best.pnl_percent,
                    'date': best.created_at.strftime('%Y-%m-%d')
                }
                worst = sorted_signals[-1]
                worst_signal = {
                    'symbol': worst.symbol,
                    'pnl_percent': worst.pnl_percent,
                    'date': worst.created_at.strftime('%Y-%m-%d')
                }

            # Signals by source
            by_source = {}
            for s in signals:
                source = s.source or 'unknown'
                if source not in by_source:
                    by_source[source] = {'total': 0, 'wins': 0}
                by_source[source]['total'] += 1
                if s.status == 'hit_tp':
                    by_source[source]['wins'] += 1

            for source in by_source:
                by_source[source]['win_rate'] = round(
                    by_source[source]['wins'] / by_source[source]['total'] * 100, 1
                )

            return {
                'period_days': days,
                'total_signals': total,
                'active_signals': active,
                'closed_signals': closed_signals,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 1),
                'total_pnl_percent': round(total_pnl, 2),
                'avg_win_percent': round(avg_win, 2),
                'avg_loss_percent': round(avg_loss, 2),
                'profit_factor': round(profit_factor, 2),
                'best_signal': best_signal,
                'worst_signal': worst_signal,
                'by_source': by_source,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            return {
                'error': str(e),
                **self._mock_stats()
            }

    def get_recent_signals(
        self,
        limit: int = 20,
        status: str = None,
        symbol: str = None,
        user_id: int = None
    ) -> List[Dict]:
        """
        Get recent signals with optional filters
        """
        SignalHistory = self._get_model()
        if not SignalHistory or not self._db:
            return self._mock_signals()

        try:
            query = SignalHistory.query

            if status:
                query = query.filter(SignalHistory.status == status)
            if symbol:
                query = query.filter(SignalHistory.symbol == symbol.upper())
            if user_id:
                query = query.filter(SignalHistory.user_id == user_id)

            signals = query.order_by(SignalHistory.created_at.desc()).limit(limit).all()

            return [{
                'id': s.id,
                'symbol': s.symbol,
                'signal_type': s.signal_type,
                'entry_price': float(s.entry_price),
                'stop_loss': float(s.stop_loss) if s.stop_loss else None,
                'take_profit': float(s.take_profit) if s.take_profit else None,
                'exit_price': float(s.exit_price) if s.exit_price else None,
                'confidence': s.confidence,
                'source': s.source,
                'status': s.status,
                'pnl_percent': s.pnl_percent,
                'reasons': s.reasons.split(',') if s.reasons else [],
                'created_at': s.created_at.isoformat(),
                'closed_at': s.closed_at.isoformat() if s.closed_at else None
            } for s in signals]

        except Exception as e:
            return self._mock_signals()

    def get_active_signals(self, user_id: int = None) -> List[Dict]:
        """Get all active (open) signals"""
        return self.get_recent_signals(limit=50, status='active', user_id=user_id)

    def get_signal_leaderboard(self, days: int = 30, limit: int = 10) -> List[Dict]:
        """
        Get top performing signals
        """
        SignalHistory = self._get_model()
        if not SignalHistory or not self._db:
            return []

        try:
            cutoff = datetime.now() - timedelta(days=days)

            signals = SignalHistory.query.filter(
                SignalHistory.created_at >= cutoff,
                SignalHistory.status == 'hit_tp',
                SignalHistory.pnl_percent.isnot(None)
            ).order_by(SignalHistory.pnl_percent.desc()).limit(limit).all()

            return [{
                'rank': i + 1,
                'symbol': s.symbol,
                'signal_type': s.signal_type,
                'pnl_percent': s.pnl_percent,
                'entry_price': float(s.entry_price),
                'exit_price': float(s.exit_price) if s.exit_price else None,
                'source': s.source,
                'date': s.created_at.strftime('%Y-%m-%d')
            } for i, s in enumerate(signals)]

        except Exception:
            return []

    def _mock_stats(self) -> Dict:
        """Return mock statistics for demo"""
        return {
            'period_days': 30,
            'total_signals': 156,
            'active_signals': 12,
            'closed_signals': 144,
            'wins': 112,
            'losses': 32,
            'win_rate': 77.8,
            'total_pnl_percent': 45.6,
            'avg_win_percent': 8.2,
            'avg_loss_percent': 4.1,
            'profit_factor': 2.0,
            'best_signal': {
                'symbol': 'TSLA',
                'pnl_percent': 15.3,
                'date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d')
            },
            'worst_signal': {
                'symbol': 'META',
                'pnl_percent': -6.2,
                'date': (datetime.now() - timedelta(days=12)).strftime('%Y-%m-%d')
            },
            'by_source': {
                'technical': {'total': 98, 'wins': 76, 'win_rate': 77.6},
                'sentiment': {'total': 32, 'wins': 22, 'win_rate': 68.8},
                'combined': {'total': 26, 'wins': 22, 'win_rate': 84.6}
            },
            'mock': True,
            'timestamp': datetime.now().isoformat()
        }

    def _mock_signals(self) -> List[Dict]:
        """Return mock signals for demo"""
        now = datetime.now()
        return [
            {
                'id': 1,
                'symbol': 'AAPL',
                'signal_type': 'BUY',
                'entry_price': 178.50,
                'stop_loss': 170.00,
                'take_profit': 195.00,
                'exit_price': None,
                'confidence': 85,
                'source': 'technical',
                'status': 'active',
                'pnl_percent': None,
                'reasons': ['RSI oversold', 'MACD bullish crossover'],
                'created_at': (now - timedelta(hours=2)).isoformat(),
                'closed_at': None
            },
            {
                'id': 2,
                'symbol': 'BTC-USD',
                'signal_type': 'SELL',
                'entry_price': 43500.00,
                'stop_loss': 45000.00,
                'take_profit': 40000.00,
                'exit_price': 41200.00,
                'confidence': 72,
                'source': 'sentiment',
                'status': 'hit_tp',
                'pnl_percent': 5.3,
                'reasons': ['Bearish news sentiment', 'RSI overbought'],
                'created_at': (now - timedelta(days=1)).isoformat(),
                'closed_at': (now - timedelta(hours=6)).isoformat()
            },
            {
                'id': 3,
                'symbol': 'NVDA',
                'signal_type': 'BUY',
                'entry_price': 485.20,
                'stop_loss': 460.00,
                'take_profit': 530.00,
                'exit_price': 458.50,
                'confidence': 68,
                'source': 'combined',
                'status': 'hit_sl',
                'pnl_percent': -5.5,
                'reasons': ['Strong bullish momentum'],
                'created_at': (now - timedelta(days=2)).isoformat(),
                'closed_at': (now - timedelta(days=1)).isoformat()
            },
            {
                'id': 4,
                'symbol': 'ETH-USD',
                'signal_type': 'BUY',
                'entry_price': 2280.00,
                'stop_loss': 2150.00,
                'take_profit': 2500.00,
                'exit_price': 2510.00,
                'confidence': 81,
                'source': 'technical',
                'status': 'hit_tp',
                'pnl_percent': 10.1,
                'reasons': ['Golden cross', 'Bullish MA alignment'],
                'created_at': (now - timedelta(days=3)).isoformat(),
                'closed_at': (now - timedelta(hours=12)).isoformat()
            },
            {
                'id': 5,
                'symbol': 'IAM',
                'signal_type': 'BUY',
                'entry_price': 118.50,
                'stop_loss': 112.00,
                'take_profit': 130.00,
                'exit_price': None,
                'confidence': 76,
                'source': 'combined',
                'status': 'active',
                'pnl_percent': None,
                'reasons': ['Moroccan market strength', 'Positive sentiment'],
                'created_at': (now - timedelta(hours=5)).isoformat(),
                'closed_at': None
            }
        ]
