from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from . import challenges_bp
from models import db, UserChallenge, User
from services.challenge_engine import ChallengeEngine

# Trial configuration
TRIAL_BALANCE = 5000  # $5,000 virtual balance
TRIAL_DAYS = 7  # 7 days trial


@challenges_bp.route('', methods=['GET'])
@jwt_required()
def get_user_challenges():
    """Get all challenges for current user"""
    current_user_id = int(get_jwt_identity())
    challenges = UserChallenge.query.filter_by(user_id=current_user_id).order_by(
        UserChallenge.start_date.desc()
    ).all()

    return jsonify({
        'challenges': [c.to_dict() for c in challenges]
    }), 200


@challenges_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_challenge():
    """Get active challenge for current user"""
    current_user_id = int(get_jwt_identity())
    challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({'error': 'No active challenge found'}), 404

    return jsonify({'challenge': challenge.to_dict()}), 200


@challenges_bp.route('/<int:challenge_id>', methods=['GET'])
@jwt_required()
def get_challenge(challenge_id):
    """Get specific challenge"""
    current_user_id = int(get_jwt_identity())
    challenge = UserChallenge.query.get(challenge_id)

    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Check ownership (unless admin)
    user = User.query.get(current_user_id)
    if challenge.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({'challenge': challenge.to_dict()}), 200


@challenges_bp.route('/<int:challenge_id>/evaluate', methods=['POST'])
@jwt_required()
def evaluate_challenge(challenge_id):
    """Manually trigger challenge evaluation"""
    current_user_id = int(get_jwt_identity())
    challenge = UserChallenge.query.get(challenge_id)

    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    if challenge.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Evaluate challenge
    engine = ChallengeEngine()
    result = engine.evaluate_challenge(challenge)

    return jsonify({
        'message': 'Challenge evaluated',
        'result': result,
        'challenge': challenge.to_dict()
    }), 200


@challenges_bp.route('/<int:challenge_id>/stats', methods=['GET'])
@jwt_required()
def get_challenge_stats(challenge_id):
    """Get detailed stats for a challenge"""
    current_user_id = int(get_jwt_identity())
    challenge = UserChallenge.query.get(challenge_id)

    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    user = User.query.get(current_user_id)
    if challenge.user_id != current_user_id and user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    engine = ChallengeEngine()
    stats = engine.get_challenge_stats(challenge)

    return jsonify({'stats': stats}), 200


@challenges_bp.route('/activate-trial', methods=['POST'])
@jwt_required()
def activate_trial():
    """Activate a free 7-day trial for the user"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if user already has an active challenge
    active_challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    if active_challenge:
        return jsonify({
            'error': 'You already have an active challenge',
            'message': 'Complete or close your current challenge before starting a trial'
        }), 400

    # Check if user already used their free trial
    previous_trial = UserChallenge.query.filter_by(
        user_id=current_user_id,
        is_trial=True
    ).first()

    if previous_trial:
        return jsonify({
            'error': 'Trial already used',
            'message': 'You have already used your free trial. Please purchase a challenge to continue trading.'
        }), 400

    # Create new trial challenge
    trial_challenge = UserChallenge(
        user_id=current_user_id,
        plan_type='trial',
        initial_balance=TRIAL_BALANCE,
        current_balance=TRIAL_BALANCE,
        highest_balance=TRIAL_BALANCE,
        status='active',
        is_trial=True,
        trial_expires_at=datetime.utcnow() + timedelta(days=TRIAL_DAYS)
    )

    db.session.add(trial_challenge)
    db.session.commit()

    return jsonify({
        'message': 'Free trial activated successfully!',
        'challenge': trial_challenge.to_dict(),
        'trial_info': {
            'balance': TRIAL_BALANCE,
            'days': TRIAL_DAYS,
            'expires_at': trial_challenge.trial_expires_at.isoformat()
        }
    }), 201


@challenges_bp.route('/check-trial', methods=['GET'])
@jwt_required()
def check_trial_status():
    """Check if user can activate a trial"""
    current_user_id = int(get_jwt_identity())

    # Check if user already used their free trial
    previous_trial = UserChallenge.query.filter_by(
        user_id=current_user_id,
        is_trial=True
    ).first()

    # Check if user has an active challenge
    active_challenge = UserChallenge.query.filter_by(
        user_id=current_user_id,
        status='active'
    ).first()

    return jsonify({
        'can_activate_trial': previous_trial is None and active_challenge is None,
        'trial_already_used': previous_trial is not None,
        'has_active_challenge': active_challenge is not None,
        'trial_info': {
            'balance': TRIAL_BALANCE,
            'days': TRIAL_DAYS
        }
    }), 200
