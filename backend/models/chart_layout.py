"""
Chart Layout Model for TradeSense

Stores user chart layouts and templates for the advanced charting system.
"""

from datetime import datetime
from . import db


class ChartLayout(db.Model):
    """User saved chart layouts"""
    __tablename__ = 'chart_layouts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    layout_type = db.Column(db.String(20), default='1x1')  # 1x1, 1x2, 2x2, etc.
    charts_config = db.Column(db.JSON)  # Array of chart configs (symbol, timeframe, etc.)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('chart_layouts', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'layout_type': self.layout_type,
            'charts_config': self.charts_config,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ChartTemplate(db.Model):
    """User saved chart templates with indicators"""
    __tablename__ = 'chart_templates'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    indicators = db.Column(db.JSON)  # Array of indicator configs
    drawing_tools = db.Column(db.JSON)  # Saved drawing tool settings
    chart_style = db.Column(db.JSON)  # Chart appearance settings
    is_public = db.Column(db.Boolean, default=False)  # Allow sharing
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('chart_templates', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'indicators': self.indicators,
            'drawing_tools': self.drawing_tools,
            'chart_style': self.chart_style,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ChartDrawing(db.Model):
    """User saved chart drawings"""
    __tablename__ = 'chart_drawings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    symbol = db.Column(db.String(20), nullable=False)
    timeframe = db.Column(db.String(10), nullable=False)
    drawing_type = db.Column(db.String(30), nullable=False)  # trendline, fibonacci, rectangle, etc.
    drawing_data = db.Column(db.JSON)  # Points, colors, styles
    is_visible = db.Column(db.Boolean, default=True)
    is_locked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('chart_drawings', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'timeframe': self.timeframe,
            'drawing_type': self.drawing_type,
            'drawing_data': self.drawing_data,
            'is_visible': self.is_visible,
            'is_locked': self.is_locked,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
