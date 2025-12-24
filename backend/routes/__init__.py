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

# Import referrals blueprint (uses its own bp definition)
from .referrals import referrals_bp

# Import points blueprint (uses its own bp definition)
from .points import points_bp

# Import tickets blueprint (uses its own bp definition)
from .tickets import tickets_bp

# Import resources blueprint (uses its own bp definition)
from .resources import resources_bp

# Import offers blueprint (uses its own bp definition)
from .offers import offers_bp

# Import two_factor blueprint (uses its own bp definition)
from .two_factor import two_factor_bp

# Import sessions blueprint (uses its own bp definition)
from .sessions import sessions_bp

# Import audit blueprint (uses its own bp definition)
from .audit import audit_bp

# Import KYC blueprint (uses its own bp definition)
from .kyc import kyc_bp

# Import subscriptions v2 blueprint (uses its own bp definition)
from .subscriptions_v2 import subscriptions_v2_bp

# Import challenge addons blueprint (uses its own bp definition)
from .challenge_addons import challenge_addons_bp

# Import affiliates blueprint (uses its own bp definition)
from .affiliates import affiliates_bp

# Import advanced orders blueprint (uses its own bp definition)
from .advanced_orders import advanced_orders_bp

# Import quick trading blueprint (uses its own bp definition)
from .quick_trading import quick_trading_bp

# Import order templates blueprint (uses its own bp definition)
from .order_templates import order_templates_bp

# Import journal blueprint (uses its own bp definition)
from .journal import journal_bp

# MT4/MT5 Integration blueprint
mt_bp = Blueprint('mt', __name__, url_prefix='/api/mt')

# Import charts blueprint (uses its own bp definition)
from .charts import charts_bp

# Import profiles blueprint (uses its own bp definition)
from .profiles import profiles_bp

# Import followers blueprint (uses its own bp definition)
from .followers import followers_bp

# Import copy trading blueprint (uses its own bp definition)
from .copy_trading import copy_trading_bp

# Import trading ideas blueprint (uses its own bp definition)
from .trading_ideas import ideas_bp

# Import push notifications blueprint (uses its own bp definition)
from .push_notifications import push_bp

# Import blog blueprint (uses its own bp definition)
from .blog import blog_bp

# Import webinars blueprint (uses its own bp definition)
from .webinars import webinars_bp

# Import OAuth blueprint (uses its own bp definition)
from .oauth import oauth_bp

# Import events blueprint (uses its own bp definition)
from .events import events_bp

# Import monitoring blueprint (uses its own bp definition)
from .monitoring import monitoring_bp

# Import routes to register them
from . import auth, challenges, trades, market_data, payments, leaderboard, admin, subscriptions, mt
