from datetime import datetime
from . import db
import bcrypt


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, admin, superadmin
    avatar = db.Column(db.String(255), default=None)
    preferred_language = db.Column(db.String(5), default='fr')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    challenges = db.relationship('UserChallenge', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)

    def set_password(self, password):
        """Hash and set the password"""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        """Check if password matches"""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'avatar': self.avatar,
            'preferred_language': self.preferred_language,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<User {self.username}>'
