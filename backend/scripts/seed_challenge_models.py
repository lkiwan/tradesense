"""
Seed script for Challenge Models
Run this script to populate the database with default challenge models
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, ChallengeModel, AccountSize


def seed_challenge_models():
    """Seed the database with default challenge models and account sizes"""

    # Stellar 1-Step Challenge
    stellar_1step = ChallengeModel(
        name='stellar_1step',
        display_name='Stellar 1-Step',
        description='Pass a single phase with 10% profit target and get funded immediately. Faster path to funding with tighter risk limits.',
        phases=1,
        phase1_profit_target=10.00,
        phase1_min_days=2,
        phase2_profit_target=None,
        phase2_min_days=None,
        max_daily_loss=3.00,
        max_overall_loss=6.00,
        leverage='1:30',
        news_trading_allowed=True,
        weekend_holding_allowed=True,
        ea_allowed=True,
        first_payout_days=5,
        payout_cycle_days=5,
        default_profit_split=80.00,
        max_profit_split=90.00,
        reset_discount=10.00,
        badge_color='purple',
        icon='zap',
        is_popular=False,
        is_new=True,
        is_active=True,
        display_order=1
    )

    # Stellar 2-Step Challenge
    stellar_2step = ChallengeModel(
        name='stellar_2step',
        display_name='Stellar 2-Step',
        description='Classic 2-phase evaluation with relaxed rules. Complete Phase 1 (8% target) and Phase 2 (5% target) to become funded.',
        phases=2,
        phase1_profit_target=8.00,
        phase1_min_days=5,
        phase2_profit_target=5.00,
        phase2_min_days=5,
        max_daily_loss=5.00,
        max_overall_loss=10.00,
        leverage='1:100',
        news_trading_allowed=True,
        weekend_holding_allowed=True,
        ea_allowed=True,
        first_payout_days=21,
        payout_cycle_days=14,
        default_profit_split=80.00,
        max_profit_split=90.00,
        reset_discount=10.00,
        badge_color='blue',
        icon='star',
        is_popular=True,
        is_new=False,
        is_active=True,
        display_order=2
    )

    # Stellar Lite Challenge
    stellar_lite = ChallengeModel(
        name='stellar_lite',
        display_name='Stellar Lite',
        description='Budget-friendly 2-phase challenge with moderate targets. Perfect for traders who want lower entry cost with balanced rules.',
        phases=2,
        phase1_profit_target=8.00,
        phase1_min_days=5,
        phase2_profit_target=4.00,
        phase2_min_days=5,
        max_daily_loss=4.00,
        max_overall_loss=8.00,
        leverage='1:100',
        news_trading_allowed=True,
        weekend_holding_allowed=True,
        ea_allowed=True,
        first_payout_days=21,
        payout_cycle_days=14,
        default_profit_split=80.00,
        max_profit_split=90.00,
        reset_discount=5.00,
        badge_color='green',
        icon='leaf',
        is_popular=False,
        is_new=False,
        is_active=True,
        display_order=3
    )

    # Add models to session
    models = [stellar_1step, stellar_2step, stellar_lite]

    for model in models:
        existing = ChallengeModel.query.filter_by(name=model.name).first()
        if existing:
            print(f"  Model '{model.name}' already exists, skipping...")
            continue
        db.session.add(model)
        print(f"  Created model: {model.display_name}")

    db.session.flush()  # Get IDs for relationships

    # Account sizes for each model
    account_sizes_data = {
        'stellar_1step': [
            (6000, 59),
            (15000, 119),
            (25000, 199),
            (50000, 299),
            (100000, 499),
            (200000, 999),
        ],
        'stellar_2step': [
            (6000, 49),
            (15000, 99),
            (25000, 179),
            (50000, 249),
            (100000, 449),
            (200000, 899),
        ],
        'stellar_lite': [
            (6000, 39),
            (15000, 79),
            (25000, 149),
            (50000, 199),
            (100000, 399),
            (200000, 799),
        ]
    }

    for model in models:
        db_model = ChallengeModel.query.filter_by(name=model.name).first()
        if not db_model:
            continue

        sizes = account_sizes_data.get(model.name, [])
        for balance, price in sizes:
            existing = AccountSize.query.filter_by(
                model_id=db_model.id,
                balance=balance
            ).first()
            if existing:
                continue

            account_size = AccountSize(
                model_id=db_model.id,
                balance=balance,
                price=price,
                is_active=True
            )
            db.session.add(account_size)

        print(f"  Added {len(sizes)} account sizes for {model.display_name}")

    db.session.commit()
    print("\nChallenge models seeded successfully!")


def clear_challenge_models():
    """Clear all challenge models (for testing)"""
    AccountSize.query.delete()
    ChallengeModel.query.delete()
    db.session.commit()
    print("All challenge models cleared.")


if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        if len(sys.argv) > 1 and sys.argv[1] == '--clear':
            clear_challenge_models()
        else:
            print("Seeding challenge models...")
            seed_challenge_models()
