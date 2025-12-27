from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .challenge_model import ChallengeModel, AccountSize
from .challenge import UserChallenge
from .trade import Trade
from .payment import Payment
from .settings import Settings
from .subscription import Subscription
from .payout import Payout
from .referral import (
    Referral, AffiliateCommission, AffiliatePayoutRequest, AffiliateStats,
    COMMISSION_RATES, PERFORMANCE_BONUSES, MINIMUM_PAYOUT
)
from .points import PointsBalance, PointsTransaction, POINT_VALUES, POINT_LEVELS
from .points_redemption import (
    PointsRedemption, RewardStock, REWARDS_CATALOG, RewardCategory,
    RedemptionStatus, LEVEL_HIERARCHY, can_redeem_reward
)
from .support_ticket import SupportTicket, TicketMessage
from .resource import Resource, EconomicEvent
from .offer import Offer, OfferUsage
from .email_queue import EmailQueue
from .two_factor_auth import TwoFactorAuth
from .user_session import UserSession
from .audit_log import AuditLog
from .kyc_data import KYCData, KYCDocument, KYCHistory, KYCTier, KYCStatus, DocumentType, KYC_TIER_LIMITS
from .subscription_plan import SubscriptionPlan, BillingInterval
from .user_subscription import UserSubscription, SubscriptionInvoice, SubscriptionStatus
from .challenge_addon import ChallengeAddon, AddonType, AddonStatus, ADDON_PRICING, calculate_reset_price, calculate_extend_price, calculate_upgrade_price
from .advanced_order import (
    TrailingStopOrder, OCOOrder, BracketOrder,
    OrderType, OrderSide, OrderStatus, get_active_orders
)
from .trading_settings import TradingSettings, QuickOrderHistory
from .order_template import OrderTemplate, DEFAULT_TEMPLATES, create_default_templates
from .trade_journal import (
    JournalEntry, JournalTemplate, EmotionType, SetupQuality, ExecutionRating,
    JOURNAL_TAGS, get_journal_analytics
)
from .mt_connection import MTConnection, MTSyncLog, MTPlatform, MTConnectionStatus
from .chart_layout import ChartLayout, ChartTemplate, ChartDrawing
from .trader_profile import (
    TraderProfile, TraderStatistics, TraderBadge, EquitySnapshot, DEFAULT_BADGES
)
from .trader_follower import (
    TraderFollower, FollowSuggestion, is_following, get_follower_count, get_following_count
)
from .copy_trade import (
    CopyRelationship, CopiedTrade, MasterTraderSettings,
    CopyStatus, CopyMode, get_active_copiers, get_copy_relationship, is_copying
)
from .trading_idea import (
    TradingIdea, IdeaComment, IdeaLike, CommentLike, IdeaBookmark,
    IdeaType, IdeaStatus, IdeaTimeframe, IDEA_TAGS,
    get_trending_ideas, get_ideas_by_symbol, get_user_ideas
)
from .push_device import (
    PushDevice, NotificationPreference, NotificationLog,
    DevicePlatform, NotificationType,
    get_user_devices, get_or_create_preferences, get_unread_count
)
from .blog_post import (
    BlogPost, BlogCategory, BlogTag, BlogComment, BlogPostLike,
    PostStatus, get_published_posts, get_featured_posts, get_related_posts,
    get_popular_posts, get_all_categories, get_popular_tags
)
from .webinar import (
    Webinar, WebinarRegistration, WebinarResource, WebinarQuestion,
    WebinarStatus, WebinarType, WebinarCategory, RegistrationStatus,
    get_upcoming_webinars, get_live_webinars, get_past_webinars_with_recordings,
    is_user_registered, get_webinar_by_slug, CATEGORY_NAMES
)
from .oauth_account import (
    OAuthAccount, OAuthProvider,
    get_oauth_account, get_user_oauth_accounts, create_oauth_account,
    link_oauth_to_user, unlink_oauth_account, find_user_by_oauth
)
from .promotional_event import (
    PromotionalEvent, EventOffer, EventRedemption, HolidayBonus,
    EventType, EventStatus, DiscountType, SEASONAL_TEMPLATES,
    get_active_events, get_active_banners, get_upcoming_events,
    get_event_by_slug, validate_promo_code, apply_best_offer
)

# Admin dashboard models
from .user_activity import (
    UserActivity, ActivityType, log_user_activity,
    get_user_activities, get_recent_activities, get_activity_stats
)
from .user_status import (
    UserStatus, get_or_create_user_status, ban_user, unban_user,
    freeze_user, unfreeze_user, block_user_trading, unblock_user_trading
)
from .platform_config import (
    PlatformConfig, get_platform_config, toggle_maintenance_mode,
    toggle_trading, update_spread_settings, is_maintenance_active, is_trading_enabled
)
from .admin_notification import (
    AdminNotification, NotificationTemplate, NotificationType, NotificationChannel,
    create_admin_notification, get_notification_history
)
from .blocked_ip import (
    BlockedIP, is_ip_blocked, block_ip, unblock_ip, get_blocked_ips,
    increment_blocked_request, cleanup_expired_blocks
)
from .admin_permission import (
    AdminPermission, AdminRole, UserAdminRole,
    PERMISSION_CATEGORIES, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS,
    has_permission, get_user_permissions, grant_permission, revoke_permission,
    grant_default_permissions, create_default_roles
)

# Signal tracking
from .signal_history import SignalHistory
