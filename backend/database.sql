-- TradeSense Database Schema
-- Prop Trading Platform

-- Drop tables if exist (for fresh install)
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS user_challenges;
DROP TABLE IF EXISTS users;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    avatar VARCHAR(255) DEFAULT NULL,
    preferred_language VARCHAR(5) DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'ar')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- USER CHALLENGES TABLE
-- =============================================
CREATE TABLE user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('starter', 'pro', 'elite')),
    initial_balance DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    highest_balance DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed')),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP DEFAULT NULL,
    failure_reason VARCHAR(100) DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_challenges_status ON user_challenges(status);
CREATE INDEX idx_challenges_start ON user_challenges(start_date);

-- =============================================
-- TRADES TABLE
-- =============================================
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL REFERENCES user_challenges(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    quantity DECIMAL(15,8) NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4) DEFAULT NULL,
    pnl DECIMAL(15,2) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_trades_challenge ON trades(challenge_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_opened ON trades(opened_at);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER DEFAULT NULL REFERENCES user_challenges(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MAD',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('paypal', 'cmi', 'crypto')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id VARCHAR(100) DEFAULT NULL,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('starter', 'pro', 'elite')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);

-- =============================================
-- SETTINGS TABLE (SuperAdmin)
-- =============================================
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_settings_key ON settings(key);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default SuperAdmin (password: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@tradesense.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJzLPaHe', 'superadmin');

-- Default Settings
INSERT INTO settings (key, value) VALUES ('platform_name', 'TradeSense');
INSERT INTO settings (key, value) VALUES ('platform_currency', 'MAD');
INSERT INTO settings (key, value) VALUES ('max_daily_loss', '0.05');
INSERT INTO settings (key, value) VALUES ('max_total_loss', '0.10');
INSERT INTO settings (key, value) VALUES ('profit_target', '0.10');

-- =============================================
-- VIEWS FOR LEADERBOARD
-- =============================================

-- View: Top Traders
CREATE VIEW IF NOT EXISTS v_leaderboard AS
SELECT
    u.id as user_id,
    u.username,
    u.avatar,
    c.id as challenge_id,
    c.plan_type,
    c.initial_balance,
    c.current_balance,
    c.status,
    c.start_date,
    ROUND(((c.current_balance - c.initial_balance) / c.initial_balance * 100), 2) as profit_pct
FROM user_challenges c
JOIN users u ON c.user_id = u.id
WHERE c.status IN ('active', 'passed')
ORDER BY profit_pct DESC;

-- View: Platform Statistics
CREATE VIEW IF NOT EXISTS v_platform_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM user_challenges) as total_challenges,
    (SELECT COUNT(*) FROM user_challenges WHERE status = 'active') as active_challenges,
    (SELECT COUNT(*) FROM user_challenges WHERE status = 'passed') as passed_challenges,
    (SELECT COUNT(*) FROM user_challenges WHERE status = 'failed') as failed_challenges,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
    (SELECT COUNT(*) FROM trades) as total_trades;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: Update highest_balance when current_balance increases
CREATE TRIGGER IF NOT EXISTS update_highest_balance
AFTER UPDATE OF current_balance ON user_challenges
WHEN NEW.current_balance > NEW.highest_balance
BEGIN
    UPDATE user_challenges
    SET highest_balance = NEW.current_balance
    WHERE id = NEW.id;
END;

-- Trigger: Set end_date when status changes to passed or failed
CREATE TRIGGER IF NOT EXISTS set_challenge_end_date
AFTER UPDATE OF status ON user_challenges
WHEN NEW.status IN ('passed', 'failed') AND OLD.status = 'active'
BEGIN
    UPDATE user_challenges
    SET end_date = CURRENT_TIMESTAMP
    WHERE id = NEW.id AND end_date IS NULL;
END;
