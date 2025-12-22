from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
challenges_bp = Blueprint('challenges', __name__, url_prefix='/api/challenges')
trades_bp = Blueprint('trades', __name__, url_prefix='/api/trades')
market_data_bp = Blueprint('market_data', __name__, url_prefix='/api/market')
payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')
leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

# Import payouts blueprint (uses its own bp definition)
from .payouts import payouts_bp

# Import challenge_models blueprint (uses its own bp definition)
from .challenge_models import challenge_models_bp

# Import routes to register them
from . import auth, challenges, trades, market_data, payments, leaderboard, admin, subscriptions
