from datetime import datetime
from decimal import Decimal
from . import db


# Point values for different activities
POINT_VALUES = {
    'trade_complete': 10,
    'profitable_day': 25,
    'phase1_passed': 500,
    'phase2_passed': 500,
    'funded': 1000,
    'referral': 200,
    'profile_complete': 50,
    'trading_streak': 50,
    'daily_login': 5
}

# Level thresholds
POINT_LEVELS = [
    {'name': 'Bronze', 'min': 0, 'max': 500},
    {'name': 'Silver', 'min': 501, 'max': 2000},
    {'name': 'Gold', 'min': 2001, 'max': 5000},
    {'name': 'Platinum', 'min': 5001, 'max': 10000},
    {'name': 'Diamond', 'min': 10001, 'max': float('inf')}
]


class PointsBalance(db.Model):
    """User's points balance and level"""
    __tablename__ = 'points_balances'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    total_points = db.Column(db.Integer, default=0)
    lifetime_earned = db.Column(db.Integer, default=0)
    level = db.Column(db.String(20), default='Bronze')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('points_balance', uselist=False))

    def add_points(self, amount):
        """Add points and update level"""
        self.total_points += amount
        self.lifetime_earned += amount
        self._update_level()

    def spend_points(self, amount):
        """Spend points (for future redemption feature)"""
        if self.total_points >= amount:
            self.total_points -= amount
            return True
        return False

    def _update_level(self):
        """Update level based on lifetime points"""
        for level in POINT_LEVELS:
            if level['min'] <= self.lifetime_earned <= level['max']:
                self.level = level['name']
                break

    def get_next_level(self):
        """Get next level info"""
        current_index = next(
            (i for i, l in enumerate(POINT_LEVELS) if l['name'] == self.level),
            0
        )
        if current_index < len(POINT_LEVELS) - 1:
            next_level = POINT_LEVELS[current_index + 1]
            return {
                'name': next_level['name'],
                'points_needed': next_level['min'] - self.lifetime_earned
            }
        return None

    def to_dict(self):
        """Convert to dictionary"""
        next_level = self.get_next_level()
        return {
            'user_id': self.user_id,
            'total_points': self.total_points,
            'lifetime_earned': self.lifetime_earned,
            'level': self.level,
            'next_level': next_level,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PointsTransaction(db.Model):
    """Individual points transaction record"""
    __tablename__ = 'points_transactions'
    __table_args__ = (
        db.Index('idx_points_tx_user', 'user_id'),
        db.Index('idx_points_tx_type', 'transaction_type'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    # Types: trade_complete, profitable_day, phase1_passed, phase2_passed, funded, referral, profile_complete, trading_streak, daily_login, spent
    description = db.Column(db.String(255))
    reference_id = db.Column(db.Integer, nullable=True)  # ID of related trade, challenge, etc.
    reference_type = db.Column(db.String(50), nullable=True)  # 'trade', 'challenge', 'referral', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref='points_transactions')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'points': self.points,
            'transaction_type': self.transaction_type,
            'description': self.description,
            'reference_id': self.reference_id,
            'reference_type': self.reference_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @staticmethod
    def award_points(user_id, transaction_type, description=None, reference_id=None, reference_type=None):
        """Award points to a user for a specific activity"""
        points = POINT_VALUES.get(transaction_type, 0)
        if points <= 0:
            return None

        # Get or create points balance
        balance = PointsBalance.query.filter_by(user_id=user_id).first()
        if not balance:
            balance = PointsBalance(user_id=user_id)
            db.session.add(balance)

        # Create transaction
        transaction = PointsTransaction(
            user_id=user_id,
            points=points,
            transaction_type=transaction_type,
            description=description or f'Earned {points} points for {transaction_type.replace("_", " ")}',
            reference_id=reference_id,
            reference_type=reference_type
        )
        db.session.add(transaction)

        # Update balance
        balance.add_points(points)
        db.session.commit()

        return transaction
