"""
Create a test user with active challenge for testing purposes
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import secrets
from app import create_app
from models import db, User, UserChallenge, ChallengeModel, PointsBalance, Payment

def create_test_user():
    """Create a complete test user with active challenge"""
    app = create_app()

    with app.app_context():
        # Check if test user already exists
        existing_user = User.query.filter_by(email='testtrader@tradesense.com').first()
        if existing_user:
            print(f"Test user already exists with ID: {existing_user.id}")
            print(f"Email: testtrader@tradesense.com")
            print(f"Password: Test123!")
            return existing_user

        # Create test user
        test_user = User(
            username='TestTrader',
            email='testtrader@tradesense.com',
            role='user',
            email_verified=True,
            email_verified_at=datetime.utcnow(),
            referral_code=secrets.token_urlsafe(8).upper()[:8],
            created_at=datetime.utcnow()
        )
        test_user.set_password('Test123!')

        db.session.add(test_user)
        db.session.flush()  # Get the user ID

        print(f"Created user: {test_user.username} (ID: {test_user.id})")

        # Get the first challenge model (Stellar 1-Step)
        challenge_model = ChallengeModel.query.first()
        if not challenge_model:
            print("Error: No challenge models found!")
            return None

        # Create an active funded challenge ($50,000 account)
        challenge = UserChallenge(
            user_id=test_user.id,
            model_id=challenge_model.id,
            account_size_id=4,  # $50,000 account
            plan_type='stellar_1step',
            initial_balance=50000.00,
            current_balance=52500.00,  # Some profit
            highest_balance=53000.00,
            status='active',
            phase='funded',  # Already funded!
            current_phase_number=1,
            is_funded=True,
            profit_target=10.0,
            total_profit_earned=2500.00,
            withdrawable_profit=2125.00,  # 85% profit split
            profit_split=85.00,
            trading_login=100001,
            trading_password='TradeSense2024',
            trading_server='TradeSense-Live',
            start_date=datetime.utcnow() - timedelta(days=30),
            trading_days=15,
            is_trial=False
        )

        db.session.add(challenge)
        db.session.flush()

        print(f"Created funded challenge: ${challenge.initial_balance:,.2f} ({challenge.phase})")

        # Create a payment record
        payment = Payment(
            user_id=test_user.id,
            challenge_id=challenge.id,
            amount=299.00,
            currency='USD',
            payment_method='card',
            status='completed',
            stripe_payment_id=f'pi_test_{secrets.token_hex(12)}',
            created_at=datetime.utcnow() - timedelta(days=30)
        )

        db.session.add(payment)

        # Create points balance
        points_balance = PointsBalance(
            user_id=test_user.id,
            total_points=2500,
            available_points=2500,
            level='silver',
            level_progress=50.0,
            lifetime_points=2500
        )

        db.session.add(points_balance)

        db.session.commit()

        print("\n" + "="*50)
        print("TEST USER CREATED SUCCESSFULLY!")
        print("="*50)
        print(f"\nLogin Credentials:")
        print(f"  Email: testtrader@tradesense.com")
        print(f"  Password: Test123!")
        print(f"\nAccount Details:")
        print(f"  Username: {test_user.username}")
        print(f"  Role: {test_user.role}")
        print(f"  Email Verified: Yes")
        print(f"  Referral Code: {test_user.referral_code}")
        print(f"\nChallenge Details:")
        print(f"  Plan: {challenge.plan_type}")
        print(f"  Status: {challenge.status}")
        print(f"  Phase: {challenge.phase} (FUNDED!)")
        print(f"  Initial Balance: ${challenge.initial_balance:,.2f}")
        print(f"  Current Balance: ${challenge.current_balance:,.2f}")
        print(f"  Profit Earned: ${challenge.total_profit_earned:,.2f}")
        print(f"  Withdrawable: ${challenge.withdrawable_profit:,.2f}")
        print(f"  Profit Split: {challenge.profit_split}%")
        print(f"\nPoints:")
        print(f"  Available: {points_balance.available_points}")
        print(f"  Level: {points_balance.level}")
        print("="*50)

        return test_user


if __name__ == '__main__':
    create_test_user()
