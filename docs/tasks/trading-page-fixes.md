# Trading Page - Bug Fixes & Structure Improvements

**Date:** 2025-12-28
**Page:** `/trading` (TradingPage.jsx)
**Priority:** HIGH

---

## Issues Identified

### ISSUE 1: Balance Not Updating After Closing Trade
**Status:** [x] FIXED
**Severity:** CRITICAL

**Symptom:** When closing BTCUSD with $1 profit, the profit is NOT added to displayed balance.

**Root Cause:**
- Backend correctly updates `challenge.current_balance` in `trades.py:154`
- Frontend uses `challenge` from ChallengeContext which is NEVER refetched after trade operations
- `closeTrade()` function calls `fetchPositions()` and `fetchPnL()` but NOT context refresh

**Location:** `frontend/src/pages/dashboard/TradingPage.jsx:213-223`

```javascript
// CURRENT (BROKEN)
const closeTrade = async (tradeId) => {
  const response = await tradesAPI.close(tradeId)
  fetchPositions()
  fetchPnL()
  // BUG: challenge.current_balance never refreshes!
}
```

**Fix Required:**
1. Add `refreshChallenge()` method to ChallengeContext
2. Call it after closing a trade
3. OR use the `new_balance` returned from close endpoint

---

### ISSUE 2: P&L Showing +$0.00 for Open Positions
**Status:** [x] FIXED
**Severity:** CRITICAL

**Symptom:** EURUSD and XAUUSD positions show +$0.00 P&L even when price has changed.

**Root Cause:**
1. `/trades/open/pnl` endpoint silently skips trades when `get_current_price()` returns `None`
2. Frontend receives incomplete list
3. `openPnL?.trades?.find(t => t.trade_id === pos.id)` returns undefined
4. Falls back to `entry_price`, making P&L = 0

**Location:** `backend/routes/trades.py:246-273`

```python
# CURRENT (BROKEN)
for trade in open_trades:
    current_price = get_current_price(trade.symbol)
    if current_price:  # If None, trade is SKIPPED entirely!
        # Calculate PnL...
        trades_pnl.append({...})
    # No else clause! Trade disappears from response
```

**Fix Required:**
1. Add fallback to entry_price when current_price is None
2. Include ALL trades in response, with a flag if price is stale
3. Log warning when price fetch fails

---

### ISSUE 3: Current Price Not Updating in Table
**Status:** [x] FIXED
**Severity:** HIGH

**Symptom:** Current price column stays at entry price.

**Root Cause:**
- `currentPriceVal = pnlInfo?.current_price || pos.entry_price`
- When pnlInfo is undefined (Issue 2), falls back to entry_price forever

**Location:** `frontend/src/pages/dashboard/TradingPage.jsx:446`

**Fix Required:**
- Ensure Issue 2 is fixed first
- Add visual indicator when price is stale/unavailable

---

### ISSUE 4: Price Service Silent Failures
**Status:** [x] FIXED
**Severity:** MEDIUM

**Symptom:** No indication when Yahoo Finance API fails.

**Root Cause:**
- `yfinance_service.py` returns `None` on failure
- `trades.py` doesn't log or report these failures
- Frontend has no idea prices are unavailable

**Location:** `backend/services/yfinance_service.py:143-173`

**Fix Required:**
1. Add logging when price fetch fails
2. Return error info in API response
3. Show warning toast in frontend when prices unavailable

---

### ISSUE 5: Decimal Precision Loss
**Status:** [x] FIXED
**Severity:** LOW

**Symptom:** Potential rounding errors in balance calculations.

**Root Cause:**
```python
# trades.py:154
challenge.current_balance = Decimal(str(float(challenge.current_balance) + pnl))
# Decimal -> float -> Decimal loses precision
```

**Fix Required:**
```python
challenge.current_balance = challenge.current_balance + Decimal(str(pnl))
```

---

## Implementation Plan

### Phase 1: Fix P&L Calculation (Backend)
**Files to modify:** `backend/routes/trades.py`

- [x] Task 1.1: Add fallback price handling in `/trades/open/pnl`
- [x] Task 1.2: Always include all open trades in response
- [x] Task 1.3: Add `price_available` flag to each trade
- [ ] Task 1.4: Add `last_updated` timestamp (optional)
- [x] Task 1.5: Fix decimal precision in balance update

### Phase 2: Fix Balance Refresh (Frontend)
**Files to modify:**
- `frontend/src/context/ChallengeContext.jsx`
- `frontend/src/pages/dashboard/TradingPage.jsx`

- [x] Task 2.1: Add `updateBalance()` method to ChallengeContext
- [x] Task 2.2: Call refresh after closeTrade()
- [x] Task 2.3: Use `new_balance` from close response for immediate update
- [ ] Task 2.4: Add loading state during refresh (optional)

### Phase 3: Improve Price Display (Frontend)
**Files to modify:** `frontend/src/pages/dashboard/TradingPage.jsx`

- [x] Task 3.1: Show stale price indicator when price unavailable
- [ ] Task 3.2: Add "Last Updated" timestamp (optional)
- [x] Task 3.3: Add warning banner when prices fail
- [ ] Task 3.4: Show loading spinner during price fetch (optional)

### Phase 4: Add Error Handling
**Files to modify:** Multiple

- [x] Task 4.1: Log price fetch failures in backend
- [x] Task 4.2: Return warnings in API response (`price_errors` array)
- [x] Task 4.3: Display warnings to user (yellow warning banner)
- [ ] Task 4.4: Add retry mechanism for failed price fetches (optional)

---

## Code Changes Required

### 1. Backend: trades.py - Fix P&L endpoint

```python
# Replace get_open_trades_pnl function (lines 221-279)

@trades_bp.route('/open/pnl', methods=['GET'])
@jwt_required()
def get_open_trades_pnl():
    """Get real-time PnL for all open trades"""
    current_user_id = int(get_jwt_identity())

    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge'}), 404

    open_trades = Trade.query.filter_by(
        challenge_id=challenge.id,
        status='open'
    ).all()

    trades_pnl = []
    total_unrealized_pnl = 0
    total_value = 0
    price_errors = []

    for trade in open_trades:
        current_price = get_current_price(trade.symbol)
        price_available = current_price is not None

        # Use entry price as fallback
        if not price_available:
            current_price = float(trade.entry_price)
            price_errors.append(trade.symbol)
            logger.warning(f"Price unavailable for {trade.symbol}, using entry price")

        # Calculate unrealized PnL
        if trade.trade_type == 'buy':
            unrealized_pnl = (current_price - float(trade.entry_price)) * float(trade.quantity)
        else:
            unrealized_pnl = (float(trade.entry_price) - current_price) * float(trade.quantity)

        pnl_percent = (unrealized_pnl / (float(trade.entry_price) * float(trade.quantity))) * 100
        current_value = current_price * float(trade.quantity)

        trades_pnl.append({
            'trade_id': trade.id,
            'symbol': trade.symbol,
            'trade_type': trade.trade_type,
            'quantity': float(trade.quantity),
            'entry_price': float(trade.entry_price),
            'current_price': current_price,
            'unrealized_pnl': round(unrealized_pnl, 2),
            'pnl_percent': round(pnl_percent, 2),
            'current_value': round(current_value, 2),
            'price_available': price_available  # NEW: Flag for price status
        })

        total_unrealized_pnl += unrealized_pnl
        total_value += current_value

    return jsonify({
        'trades': trades_pnl,
        'total_unrealized_pnl': round(total_unrealized_pnl, 2),
        'total_value': round(total_value, 2),
        'current_balance': float(challenge.current_balance),
        'effective_balance': round(float(challenge.current_balance) + total_unrealized_pnl, 2),
        'price_errors': price_errors  # NEW: List of symbols with price issues
    }), 200
```

### 2. Backend: trades.py - Fix balance update precision

```python
# Line 152-156: Replace balance update
# OLD:
challenge.current_balance = Decimal(str(float(challenge.current_balance) + pnl))

# NEW:
challenge.current_balance = challenge.current_balance + Decimal(str(pnl))
```

### 3. Frontend: ChallengeContext.jsx - Add refresh method

```javascript
// Add to ChallengeContext
const refreshChallenge = async () => {
  try {
    const response = await challengesAPI.getActive()
    if (response.data) {
      setChallenge(response.data)
    }
  } catch (error) {
    console.error('Failed to refresh challenge:', error)
  }
}

// Export in context value
return (
  <ChallengeContext.Provider value={{ challenge, refreshChallenge, ... }}>
```

### 4. Frontend: TradingPage.jsx - Fix closeTrade

```javascript
// Import refreshChallenge from context
const { challenge, refreshChallenge } = useChallenge()

// Update closeTrade function
const closeTrade = async (tradeId) => {
  try {
    const response = await tradesAPI.close(tradeId)
    const pnl = response.data.pnl
    const newBalance = response.data.new_balance

    showSuccessToast(`Trade closed! PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`)

    // Refresh all data
    await Promise.all([
      fetchPositions(),
      fetchPnL(),
      refreshChallenge()  // NEW: Refresh balance
    ])
  } catch (error) {
    showErrorToast(error)
  }
}
```

---

## Testing Checklist

- [ ] Open a BUY trade for EURUSD
- [ ] Wait for price to change, verify P&L updates (not $0.00)
- [ ] Close the trade, verify:
  - [ ] Balance updates immediately
  - [ ] Toast shows correct P&L
  - [ ] Trade disappears from open positions
- [ ] Open multiple trades
- [ ] Close one, verify others still show correct P&L
- [ ] Test with symbol that might have price issues (edge case)
- [ ] Verify no console errors

---

## Notes

- Yahoo Finance API can be slow/unreliable - consider adding cache
- Consider WebSocket for real-time price updates instead of polling
- Add rate limiting awareness to prevent API bans
