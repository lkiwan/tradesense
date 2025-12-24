"""
Copy Trading Service
Handles the logic for copying trades from master traders to copiers.
"""
from datetime import datetime, date
from models import (
    db, Trade, CopyRelationship, CopiedTrade, MasterTraderSettings,
    CopyStatus, CopyMode, TraderProfile, get_active_copiers
)


class CopyTradingService:
    """Service for managing copy trading operations"""

    @staticmethod
    def calculate_lot_size(relationship, master_trade):
        """Calculate the lot size for a copied trade based on settings"""
        if relationship.copy_mode == CopyMode.PROPORTIONAL.value:
            return round(master_trade.lot_size * relationship.copy_ratio, 2)
        elif relationship.copy_mode == CopyMode.FIXED_LOT.value:
            return relationship.fixed_lot_size
        elif relationship.copy_mode == CopyMode.FIXED_AMOUNT.value:
            # Simplified calculation - in production, use pip value
            pip_value = 10  # Approximate pip value per lot
            risk_per_trade = relationship.fixed_amount
            if master_trade.stop_loss:
                sl_pips = abs(master_trade.entry_price - master_trade.stop_loss) * 10000
                if sl_pips > 0:
                    return round(risk_per_trade / (sl_pips * pip_value), 2)
            return relationship.fixed_lot_size
        return relationship.fixed_lot_size

    @staticmethod
    def should_copy_trade(relationship, master_trade):
        """Determine if a trade should be copied based on filters"""
        # Check if copying is active
        if relationship.status != CopyStatus.ACTIVE.value:
            return False, "Copy relationship is not active"

        # Check direction filter
        if master_trade.direction == 'buy' and not relationship.copy_buy:
            return False, "Buy trades not allowed"
        if master_trade.direction == 'sell' and not relationship.copy_sell:
            return False, "Sell trades not allowed"

        # Check symbol filters
        if relationship.allowed_symbols:
            if master_trade.symbol not in relationship.allowed_symbols:
                return False, f"Symbol {master_trade.symbol} not in allowed list"

        if relationship.excluded_symbols:
            if master_trade.symbol in relationship.excluded_symbols:
                return False, f"Symbol {master_trade.symbol} is excluded"

        # Check max open trades
        open_copied_trades = CopiedTrade.query.join(Trade, CopiedTrade.copier_trade_id == Trade.id).filter(
            CopiedTrade.copy_relationship_id == relationship.id,
            Trade.status == 'open'
        ).count()

        if open_copied_trades >= relationship.max_open_trades:
            return False, "Max open trades limit reached"

        # Check daily trade limit
        today = date.today()
        today_trades = CopiedTrade.query.filter(
            CopiedTrade.copy_relationship_id == relationship.id,
            db.func.date(CopiedTrade.created_at) == today
        ).count()

        if today_trades >= relationship.max_daily_trades:
            return False, "Max daily trades limit reached"

        # Check drawdown
        if relationship.current_drawdown >= relationship.max_drawdown_percent:
            return False, "Max drawdown exceeded"

        return True, "OK"

    @staticmethod
    def copy_trade(relationship, master_trade):
        """Execute a copy trade"""
        # Check if should copy
        should_copy, reason = CopyTradingService.should_copy_trade(relationship, master_trade)

        # Create copied trade record
        copied_trade = CopiedTrade(
            copy_relationship_id=relationship.id,
            master_trade_id=master_trade.id,
            original_lot_size=master_trade.lot_size,
            original_entry_price=master_trade.entry_price,
            master_opened_at=master_trade.opened_at or datetime.utcnow()
        )

        if not should_copy:
            copied_trade.status = 'skipped'
            copied_trade.skip_reason = reason
            db.session.add(copied_trade)
            db.session.commit()
            return copied_trade

        # Calculate lot size
        lot_size = CopyTradingService.calculate_lot_size(relationship, master_trade)

        # Apply max lot size limit
        if lot_size > relationship.max_lot_size:
            lot_size = relationship.max_lot_size

        # Create the actual trade for the copier
        copier_trade = Trade(
            user_id=relationship.copier_id,
            challenge_id=None,  # Would need to get copier's active challenge
            symbol=master_trade.symbol,
            direction=master_trade.direction,
            lot_size=lot_size,
            entry_price=master_trade.entry_price,
            stop_loss=master_trade.stop_loss,
            take_profit=master_trade.take_profit,
            status='open',
            opened_at=datetime.utcnow(),
            is_copied=True
        )

        # Apply SL/TP adjustments if set
        if relationship.stop_loss_adjustment and copier_trade.stop_loss:
            adjustment = relationship.stop_loss_adjustment / 10000  # Convert pips to price
            if copier_trade.direction == 'buy':
                copier_trade.stop_loss -= adjustment
            else:
                copier_trade.stop_loss += adjustment

        if relationship.take_profit_adjustment and copier_trade.take_profit:
            adjustment = relationship.take_profit_adjustment / 10000
            if copier_trade.direction == 'buy':
                copier_trade.take_profit += adjustment
            else:
                copier_trade.take_profit -= adjustment

        db.session.add(copier_trade)
        db.session.flush()  # Get the ID

        # Update copied trade record
        copied_trade.copier_trade_id = copier_trade.id
        copied_trade.copied_lot_size = lot_size
        copied_trade.copied_entry_price = copier_trade.entry_price
        copied_trade.copier_opened_at = copier_trade.opened_at
        copied_trade.status = 'executed'
        copied_trade.slippage_pips = 0  # Would calculate actual slippage in production

        db.session.add(copied_trade)

        # Update relationship stats
        relationship.total_copied_trades += 1

        db.session.commit()
        return copied_trade

    @staticmethod
    def broadcast_trade(master_trade):
        """Broadcast a trade to all copiers of the master"""
        copiers = get_active_copiers(master_trade.user_id)
        results = []

        for relationship in copiers:
            try:
                copied = CopyTradingService.copy_trade(relationship, master_trade)
                results.append({
                    'copier_id': relationship.copier_id,
                    'status': copied.status,
                    'reason': copied.skip_reason
                })
            except Exception as e:
                results.append({
                    'copier_id': relationship.copier_id,
                    'status': 'error',
                    'reason': str(e)
                })

        return results

    @staticmethod
    def close_copied_trade(master_trade):
        """Close all copied trades when master trade is closed"""
        # Find all copied trades for this master trade
        copied_trades = CopiedTrade.query.filter_by(
            master_trade_id=master_trade.id,
            status='executed'
        ).all()

        for copied in copied_trades:
            if copied.copier_trade and copied.copier_trade.status == 'open':
                # Close the copier's trade
                copier_trade = copied.copier_trade
                copier_trade.status = 'closed'
                copier_trade.exit_price = master_trade.exit_price
                copier_trade.closed_at = datetime.utcnow()

                # Calculate profit (simplified)
                if copier_trade.direction == 'buy':
                    pips = (copier_trade.exit_price - copier_trade.entry_price) * 10000
                else:
                    pips = (copier_trade.entry_price - copier_trade.exit_price) * 10000

                copier_trade.profit_pips = pips
                copier_trade.profit = pips * copier_trade.lot_size * 10  # Simplified calculation

                # Update copied trade record
                copied.copier_closed_at = copier_trade.closed_at
                copied.master_closed_at = master_trade.closed_at
                copied.master_profit = master_trade.profit
                copied.copier_profit = copier_trade.profit

                # Update relationship stats
                relationship = copied.copy_relationship
                if copier_trade.profit > 0:
                    relationship.total_profit += copier_trade.profit
                else:
                    relationship.total_loss += abs(copier_trade.profit)

        db.session.commit()

    @staticmethod
    def get_copyable_traders(limit=20, min_trades=10, min_win_rate=50):
        """Get list of traders available for copying"""
        from models import TraderStatistics

        # Get traders with good stats who allow copying
        traders = db.session.query(
            TraderProfile, TraderStatistics, MasterTraderSettings
        ).join(
            TraderStatistics,
            TraderProfile.user_id == TraderStatistics.user_id
        ).outerjoin(
            MasterTraderSettings,
            TraderProfile.user_id == MasterTraderSettings.user_id
        ).filter(
            TraderProfile.is_public == True,
            TraderProfile.allow_copy_trading == True,
            TraderStatistics.total_trades >= min_trades,
            TraderStatistics.win_rate >= min_win_rate
        ).order_by(
            TraderStatistics.win_rate.desc()
        ).limit(limit).all()

        return traders

    @staticmethod
    def calculate_performance_fee(relationship, profit):
        """Calculate performance fee for master trader"""
        if profit <= 0:
            return 0

        master_settings = MasterTraderSettings.query.filter_by(
            user_id=relationship.master_id
        ).first()

        if not master_settings:
            return 0

        fee = profit * (master_settings.performance_fee_percent / 100)
        return round(fee, 2)
