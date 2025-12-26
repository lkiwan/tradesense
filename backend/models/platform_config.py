from datetime import datetime
from . import db


class PlatformConfig(db.Model):
    """Platform-wide configuration settings managed by SuperAdmin"""
    __tablename__ = 'platform_config'

    id = db.Column(db.Integer, primary_key=True)

    # Config type for multiple config records (system, trading, platform)
    config_type = db.Column(db.String(50), nullable=True, index=True, unique=True)

    # Generic config data storage (JSON) - used by superadmin_config routes
    config_data = db.Column(db.JSON, nullable=True)

    # Maintenance mode
    maintenance_mode = db.Column(db.Boolean, default=False)
    maintenance_message = db.Column(db.Text, nullable=True)
    maintenance_started_at = db.Column(db.DateTime, nullable=True)
    maintenance_ends_at = db.Column(db.DateTime, nullable=True)

    # Trading control
    trading_enabled = db.Column(db.Boolean, default=True)
    trading_disabled_message = db.Column(db.Text, nullable=True)
    trading_disabled_at = db.Column(db.DateTime, nullable=True)

    # Spread settings
    default_spread_pips = db.Column(db.Numeric(5, 2), default=0.5)
    spread_multiplier = db.Column(db.Numeric(5, 2), default=1.0)
    spread_config = db.Column(db.Text, nullable=True)  # JSON for per-symbol spreads

    # Registration control
    registration_enabled = db.Column(db.Boolean, default=True)
    registration_message = db.Column(db.Text, nullable=True)

    # Rate limiting overrides
    global_rate_limit_multiplier = db.Column(db.Numeric(3, 2), default=1.0)

    # Feature flags
    features_config = db.Column(db.Text, nullable=True)  # JSON for feature flags

    # Audit
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Relationship
    updated_by_user = db.relationship('User', foreign_keys=[updated_by])

    def to_dict(self):
        """Convert to dictionary"""
        import json
        return {
            'id': self.id,
            'config_type': self.config_type,
            'config_data': self.config_data,
            'maintenance_mode': self.maintenance_mode,
            'maintenance_message': self.maintenance_message,
            'maintenance_started_at': self.maintenance_started_at.isoformat() if self.maintenance_started_at else None,
            'maintenance_ends_at': self.maintenance_ends_at.isoformat() if self.maintenance_ends_at else None,
            'trading_enabled': self.trading_enabled,
            'trading_disabled_message': self.trading_disabled_message,
            'default_spread_pips': float(self.default_spread_pips) if self.default_spread_pips else 0.5,
            'spread_multiplier': float(self.spread_multiplier) if self.spread_multiplier else 1.0,
            'spread_config': json.loads(self.spread_config) if self.spread_config else {},
            'registration_enabled': self.registration_enabled,
            'features_config': json.loads(self.features_config) if self.features_config else {},
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'updated_by': self.updated_by
        }

    def __repr__(self):
        return f'<PlatformConfig maintenance={self.maintenance_mode} trading={self.trading_enabled}>'


def get_platform_config():
    """Get or create the singleton platform config"""
    config = PlatformConfig.query.first()
    if not config:
        config = PlatformConfig()
        db.session.add(config)
        db.session.commit()
    return config


def toggle_maintenance_mode(enabled, message=None, ends_at=None, updated_by_id=None):
    """Toggle maintenance mode"""
    config = get_platform_config()
    config.maintenance_mode = enabled
    config.maintenance_message = message
    config.updated_by = updated_by_id
    if enabled:
        config.maintenance_started_at = datetime.utcnow()
        config.maintenance_ends_at = ends_at
    else:
        config.maintenance_started_at = None
        config.maintenance_ends_at = None
    db.session.commit()
    return config


def toggle_trading(enabled, message=None, updated_by_id=None):
    """Enable or disable all trading"""
    config = get_platform_config()
    config.trading_enabled = enabled
    config.trading_disabled_message = message if not enabled else None
    config.trading_disabled_at = datetime.utcnow() if not enabled else None
    config.updated_by = updated_by_id
    db.session.commit()
    return config


def update_spread_settings(default_pips=None, multiplier=None, per_symbol=None, updated_by_id=None):
    """Update spread settings"""
    import json
    config = get_platform_config()
    if default_pips is not None:
        config.default_spread_pips = default_pips
    if multiplier is not None:
        config.spread_multiplier = multiplier
    if per_symbol is not None:
        config.spread_config = json.dumps(per_symbol)
    config.updated_by = updated_by_id
    db.session.commit()
    return config


def is_maintenance_active():
    """Check if maintenance mode is active"""
    config = get_platform_config()
    if not config.maintenance_mode:
        return False
    if config.maintenance_ends_at and datetime.utcnow() > config.maintenance_ends_at:
        # Auto-disable maintenance if end time passed
        config.maintenance_mode = False
        config.maintenance_started_at = None
        config.maintenance_ends_at = None
        db.session.commit()
        return False
    return True


def is_trading_enabled():
    """Check if trading is enabled platform-wide"""
    config = get_platform_config()
    return config.trading_enabled
