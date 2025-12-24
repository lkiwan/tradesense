"""
MT4/MT5 Connection Model for TradeSense

Stores MetaTrader connection credentials and status for each user.
Uses MetaAPI for MT4/MT5 connectivity.
"""

from datetime import datetime
from enum import Enum
from . import db


class MTPlatform(Enum):
    """MetaTrader platform types"""
    MT4 = 'mt4'
    MT5 = 'mt5'


class MTConnectionStatus(Enum):
    """Connection status options"""
    DISCONNECTED = 'disconnected'
    CONNECTING = 'connecting'
    CONNECTED = 'connected'
    SYNCING = 'syncing'
    ERROR = 'error'
    DEPLOYING = 'deploying'


class MTConnection(db.Model):
    """
    MetaTrader connection record for a user.
    Stores MetaAPI account ID and connection details.
    """
    __tablename__ = 'mt_connections'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id', ondelete='SET NULL'), nullable=True)

    # MT Account Info
    platform = db.Column(db.String(10), default=MTPlatform.MT5.value)  # mt4 or mt5
    broker_name = db.Column(db.String(100))
    server = db.Column(db.String(200), nullable=False)
    login = db.Column(db.String(50), nullable=False)

    # MetaAPI Integration
    metaapi_account_id = db.Column(db.String(100), unique=True)  # MetaAPI provisioned account ID
    metaapi_deploy_state = db.Column(db.String(50))  # CREATED, DEPLOYING, DEPLOYED, etc.

    # Connection Status
    status = db.Column(db.String(20), default=MTConnectionStatus.DISCONNECTED.value)
    last_connected_at = db.Column(db.DateTime)
    last_sync_at = db.Column(db.DateTime)
    connection_error = db.Column(db.Text)

    # Account Details (synced from MT)
    account_name = db.Column(db.String(100))
    account_currency = db.Column(db.String(10), default='USD')
    account_leverage = db.Column(db.Integer)
    account_balance = db.Column(db.Numeric(15, 2))
    account_equity = db.Column(db.Numeric(15, 2))
    account_margin = db.Column(db.Numeric(15, 2))
    account_free_margin = db.Column(db.Numeric(15, 2))

    # Sync Settings
    auto_sync_enabled = db.Column(db.Boolean, default=True)
    sync_interval_seconds = db.Column(db.Integer, default=30)
    sync_trades = db.Column(db.Boolean, default=True)
    sync_history = db.Column(db.Boolean, default=True)

    # Trade Execution Settings
    allow_trade_execution = db.Column(db.Boolean, default=False)  # Safety: must be explicitly enabled
    max_lot_size = db.Column(db.Numeric(10, 2), default=1.0)

    # Security - Password is encrypted
    encrypted_password = db.Column(db.LargeBinary)  # Encrypted MT password

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('mt_connections', lazy='dynamic'))
    challenge = db.relationship('UserChallenge', backref=db.backref('mt_connection', uselist=False))

    def __repr__(self):
        return f'<MTConnection {self.id}: {self.platform} {self.login}@{self.server}>'

    @property
    def is_connected(self):
        """Check if connection is active"""
        return self.status == MTConnectionStatus.CONNECTED.value

    @property
    def is_deployed(self):
        """Check if MetaAPI account is deployed"""
        return self.metaapi_deploy_state == 'DEPLOYED'

    def set_connected(self):
        """Mark connection as connected"""
        self.status = MTConnectionStatus.CONNECTED.value
        self.last_connected_at = datetime.utcnow()
        self.connection_error = None

    def set_disconnected(self, error=None):
        """Mark connection as disconnected"""
        self.status = MTConnectionStatus.DISCONNECTED.value
        if error:
            self.connection_error = str(error)

    def set_error(self, error):
        """Mark connection as having error"""
        self.status = MTConnectionStatus.ERROR.value
        self.connection_error = str(error)

    def update_account_info(self, account_info):
        """Update account information from MetaAPI"""
        self.account_name = account_info.get('name')
        self.account_currency = account_info.get('currency', 'USD')
        self.account_leverage = account_info.get('leverage')
        self.account_balance = account_info.get('balance')
        self.account_equity = account_info.get('equity')
        self.account_margin = account_info.get('margin')
        self.account_free_margin = account_info.get('freeMargin')
        self.last_sync_at = datetime.utcnow()

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for API responses"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'platform': self.platform,
            'broker_name': self.broker_name,
            'server': self.server,
            'login': self.login,
            'status': self.status,
            'is_connected': self.is_connected,
            'is_deployed': self.is_deployed,
            'last_connected_at': self.last_connected_at.isoformat() if self.last_connected_at else None,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'connection_error': self.connection_error,
            'account_info': {
                'name': self.account_name,
                'currency': self.account_currency,
                'leverage': self.account_leverage,
                'balance': float(self.account_balance) if self.account_balance else None,
                'equity': float(self.account_equity) if self.account_equity else None,
                'margin': float(self.account_margin) if self.account_margin else None,
                'free_margin': float(self.account_free_margin) if self.account_free_margin else None
            },
            'settings': {
                'auto_sync_enabled': self.auto_sync_enabled,
                'sync_interval_seconds': self.sync_interval_seconds,
                'sync_trades': self.sync_trades,
                'sync_history': self.sync_history,
                'allow_trade_execution': self.allow_trade_execution,
                'max_lot_size': float(self.max_lot_size) if self.max_lot_size else 1.0
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_sensitive:
            data['metaapi_account_id'] = self.metaapi_account_id
            data['metaapi_deploy_state'] = self.metaapi_deploy_state

        return data

    @classmethod
    def get_user_connection(cls, user_id, challenge_id=None):
        """Get user's MT connection, optionally for specific challenge"""
        query = cls.query.filter_by(user_id=user_id)
        if challenge_id:
            query = query.filter_by(challenge_id=challenge_id)
        return query.first()

    @classmethod
    def get_active_connections(cls):
        """Get all active connections for sync"""
        return cls.query.filter(
            cls.status == MTConnectionStatus.CONNECTED.value,
            cls.auto_sync_enabled == True
        ).all()


class MTSyncLog(db.Model):
    """
    Log of MT synchronization events.
    Tracks trade syncs, balance updates, and errors.
    """
    __tablename__ = 'mt_sync_logs'

    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(db.Integer, db.ForeignKey('mt_connections.id', ondelete='CASCADE'), nullable=False)

    # Sync Details
    sync_type = db.Column(db.String(50))  # account_info, positions, history, trade_execution
    status = db.Column(db.String(20))  # success, failed, partial

    # Data synced
    trades_synced = db.Column(db.Integer, default=0)
    positions_synced = db.Column(db.Integer, default=0)
    history_synced = db.Column(db.Integer, default=0)

    # Timing
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    duration_ms = db.Column(db.Integer)

    # Error info
    error_message = db.Column(db.Text)

    # Relationships
    connection = db.relationship('MTConnection', backref=db.backref('sync_logs', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'connection_id': self.connection_id,
            'sync_type': self.sync_type,
            'status': self.status,
            'trades_synced': self.trades_synced,
            'positions_synced': self.positions_synced,
            'history_synced': self.history_synced,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_ms': self.duration_ms,
            'error_message': self.error_message
        }
