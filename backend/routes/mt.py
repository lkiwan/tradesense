"""
MT4/MT5 Connection Routes for TradeSense

Provides endpoints for:
- Connecting MT accounts via MetaAPI
- Syncing positions and history
- Executing trades through MT
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from . import mt_bp
from models import db, MTConnection, MTSyncLog, User, UserChallenge
from services.metaapi_service import metaapi_service, run_async


@mt_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    """Get all MT connections for current user"""
    current_user_id = int(get_jwt_identity())

    connections = MTConnection.query.filter_by(user_id=current_user_id).all()

    return jsonify({
        'connections': [conn.to_dict() for conn in connections]
    }), 200


@mt_bp.route('/connect', methods=['POST'])
@jwt_required()
def connect_mt_account():
    """
    Connect a new MT4/MT5 account.

    Request body:
    {
        "login": "12345678",
        "password": "mt_password",
        "server": "ICMarkets-Demo",
        "platform": "mt5",  // or "mt4"
        "broker_name": "IC Markets",  // optional
        "challenge_id": 1  // optional, link to challenge
    }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate required fields
    required = ['login', 'password', 'server']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    login = data['login']
    password = data['password']
    server = data['server']
    platform = data.get('platform', 'mt5').lower()
    broker_name = data.get('broker_name')
    challenge_id = data.get('challenge_id')

    # Validate platform
    if platform not in ['mt4', 'mt5']:
        return jsonify({'error': 'Platform must be mt4 or mt5'}), 400

    # Check if connection already exists for this login/server
    existing = MTConnection.query.filter_by(
        user_id=current_user_id,
        login=login,
        server=server
    ).first()

    if existing:
        return jsonify({
            'error': 'Connection already exists for this account',
            'connection_id': existing.id
        }), 409

    # Verify challenge ownership if provided
    if challenge_id:
        challenge = UserChallenge.query.get(challenge_id)
        if not challenge or challenge.user_id != current_user_id:
            return jsonify({'error': 'Invalid challenge'}), 404

    try:
        # Create account in MetaAPI
        result = run_async(metaapi_service.create_account(
            login=login,
            password=password,
            server=server,
            platform=platform,
            broker_name=broker_name
        ))

        if not result.get('success'):
            return jsonify({
                'error': result.get('error', 'Failed to connect MT account')
            }), 400

        # Create connection record
        connection = MTConnection(
            user_id=current_user_id,
            challenge_id=challenge_id,
            platform=platform,
            broker_name=broker_name,
            server=server,
            login=login,
            metaapi_account_id=result.get('metaapi_account_id'),
            metaapi_deploy_state=result.get('deploy_state'),
            status='connected',
            encrypted_password=metaapi_service.encrypt_password(password)
        )

        # Update with account info
        account_info = result.get('account_info', {})
        connection.account_name = account_info.get('name')
        connection.account_currency = account_info.get('currency', 'USD')
        connection.account_leverage = account_info.get('leverage')
        connection.account_balance = account_info.get('balance')
        connection.account_equity = account_info.get('equity')
        connection.account_margin = account_info.get('margin')
        connection.account_free_margin = account_info.get('freeMargin')
        connection.last_connected_at = datetime.utcnow()
        connection.last_sync_at = datetime.utcnow()

        db.session.add(connection)
        db.session.commit()

        # Log sync event
        sync_log = MTSyncLog(
            connection_id=connection.id,
            sync_type='initial_connection',
            status='success',
            completed_at=datetime.utcnow()
        )
        db.session.add(sync_log)
        db.session.commit()

        return jsonify({
            'message': 'MT account connected successfully',
            'connection': connection.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/disconnect/<int:connection_id>', methods=['POST'])
@jwt_required()
def disconnect_mt_account(connection_id):
    """Disconnect an MT account"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Disconnect from MetaAPI
        if connection.metaapi_account_id:
            result = run_async(metaapi_service.disconnect_account(
                connection.metaapi_account_id
            ))

        # Update status
        connection.status = 'disconnected'
        connection.connection_error = None
        db.session.commit()

        return jsonify({
            'message': 'MT account disconnected',
            'connection': connection.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/reconnect/<int:connection_id>', methods=['POST'])
@jwt_required()
def reconnect_mt_account(connection_id):
    """Reconnect a disconnected MT account"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Reconnect via MetaAPI
        if connection.metaapi_account_id:
            result = run_async(metaapi_service.connect_account(
                connection.metaapi_account_id
            ))

            if not result.get('success'):
                connection.set_error(result.get('error', 'Connection failed'))
                db.session.commit()
                return jsonify({'error': result.get('error')}), 400

            # Update connection info
            account_info = result.get('account_info', {})
            connection.update_account_info(account_info)
            connection.set_connected()
            db.session.commit()

        return jsonify({
            'message': 'MT account reconnected',
            'connection': connection.to_dict()
        }), 200

    except Exception as e:
        connection.set_error(str(e))
        db.session.commit()
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/sync/<int:connection_id>', methods=['POST'])
@jwt_required()
def sync_mt_account(connection_id):
    """Sync account info, positions, and history from MT"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    sync_log = MTSyncLog(
        connection_id=connection.id,
        sync_type='manual_sync',
        status='in_progress',
        started_at=datetime.utcnow()
    )
    db.session.add(sync_log)
    db.session.commit()

    try:
        # Get account info
        account_result = run_async(metaapi_service.get_account_info(
            connection.metaapi_account_id
        ))

        if account_result.get('success'):
            connection.update_account_info(account_result.get('account_info', {}))

        # Get positions
        positions_result = run_async(metaapi_service.get_positions(
            connection.metaapi_account_id
        ))

        positions = []
        if positions_result.get('success'):
            positions = positions_result.get('positions', [])
            sync_log.positions_synced = len(positions)

        # Get history (last 7 days)
        from datetime import timedelta
        history_result = run_async(metaapi_service.get_history(
            connection.metaapi_account_id,
            start_time=datetime.utcnow() - timedelta(days=7),
            end_time=datetime.utcnow()
        ))

        deals = []
        if history_result.get('success'):
            deals = history_result.get('deals', [])
            sync_log.history_synced = len(deals)

        # Update sync log
        sync_log.status = 'success'
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_ms = int((sync_log.completed_at - sync_log.started_at).total_seconds() * 1000)

        db.session.commit()

        return jsonify({
            'message': 'Sync completed',
            'connection': connection.to_dict(),
            'positions': positions,
            'recent_deals': deals[:20],  # Last 20 deals
            'sync_stats': {
                'positions_synced': len(positions),
                'deals_synced': len(deals),
                'duration_ms': sync_log.duration_ms
            }
        }), 200

    except Exception as e:
        sync_log.status = 'failed'
        sync_log.error_message = str(e)
        sync_log.completed_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'error': str(e)}), 500


@mt_bp.route('/account-info/<int:connection_id>', methods=['GET'])
@jwt_required()
def get_account_info(connection_id):
    """Get current account information"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    try:
        result = run_async(metaapi_service.get_account_info(
            connection.metaapi_account_id
        ))

        if result.get('success'):
            # Update stored values
            connection.update_account_info(result.get('account_info', {}))
            db.session.commit()

            return jsonify({
                'account_info': result.get('account_info'),
                'connection': connection.to_dict()
            }), 200
        else:
            return jsonify({'error': result.get('error')}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/positions/<int:connection_id>', methods=['GET'])
@jwt_required()
def get_positions(connection_id):
    """Get open positions"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    try:
        result = run_async(metaapi_service.get_positions(
            connection.metaapi_account_id
        ))

        if result.get('success'):
            return jsonify({
                'positions': result.get('positions', [])
            }), 200
        else:
            return jsonify({'error': result.get('error')}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/history/<int:connection_id>', methods=['GET'])
@jwt_required()
def get_history(connection_id):
    """Get trading history"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    # Get date range from query params
    days = request.args.get('days', 30, type=int)
    from datetime import timedelta

    try:
        result = run_async(metaapi_service.get_history(
            connection.metaapi_account_id,
            start_time=datetime.utcnow() - timedelta(days=days),
            end_time=datetime.utcnow()
        ))

        if result.get('success'):
            return jsonify({
                'deals': result.get('deals', [])
            }), 200
        else:
            return jsonify({'error': result.get('error')}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/execute/<int:connection_id>', methods=['POST'])
@jwt_required()
def execute_trade(connection_id):
    """
    Execute a trade through MT.

    Request body:
    {
        "symbol": "EURUSD",
        "side": "buy",  // or "sell"
        "volume": 0.1,
        "stop_loss": 1.0800,  // optional
        "take_profit": 1.0900,  // optional
        "comment": "TradeSense order"  // optional
    }
    """
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    if not connection.allow_trade_execution:
        return jsonify({
            'error': 'Trade execution is disabled for this connection. Enable it in settings.'
        }), 403

    data = request.get_json()

    # Validate required fields
    if not data.get('symbol'):
        return jsonify({'error': 'symbol is required'}), 400
    if not data.get('side'):
        return jsonify({'error': 'side is required'}), 400
    if not data.get('volume'):
        return jsonify({'error': 'volume is required'}), 400

    symbol = data['symbol']
    side = data['side'].lower()
    volume = float(data['volume'])

    # Validate side
    if side not in ['buy', 'sell']:
        return jsonify({'error': 'side must be buy or sell'}), 400

    # Check max lot size
    if connection.max_lot_size and volume > float(connection.max_lot_size):
        return jsonify({
            'error': f'Volume exceeds maximum allowed ({connection.max_lot_size} lots)'
        }), 400

    try:
        result = run_async(metaapi_service.execute_trade(
            metaapi_account_id=connection.metaapi_account_id,
            symbol=symbol,
            side=side,
            volume=volume,
            stop_loss=data.get('stop_loss'),
            take_profit=data.get('take_profit'),
            comment=data.get('comment', 'TradeSense')
        ))

        if result.get('success'):
            return jsonify({
                'message': 'Trade executed successfully',
                'result': result
            }), 200
        else:
            return jsonify({'error': result.get('error')}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/close-position/<int:connection_id>', methods=['POST'])
@jwt_required()
def close_position(connection_id):
    """
    Close an open position.

    Request body:
    {
        "position_id": "12345",
        "volume": 0.05  // optional, for partial close
    }
    """
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if not connection.metaapi_account_id:
        return jsonify({'error': 'No MetaAPI account linked'}), 400

    if not connection.allow_trade_execution:
        return jsonify({'error': 'Trade execution is disabled'}), 403

    data = request.get_json()

    if not data.get('position_id'):
        return jsonify({'error': 'position_id is required'}), 400

    try:
        result = run_async(metaapi_service.close_position(
            metaapi_account_id=connection.metaapi_account_id,
            position_id=data['position_id'],
            volume=data.get('volume')
        ))

        if result.get('success'):
            return jsonify({
                'message': 'Position closed successfully',
                'result': result
            }), 200
        else:
            return jsonify({'error': result.get('error')}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/settings/<int:connection_id>', methods=['PUT'])
@jwt_required()
def update_settings(connection_id):
    """
    Update MT connection settings.

    Request body:
    {
        "auto_sync_enabled": true,
        "sync_interval_seconds": 30,
        "allow_trade_execution": false,
        "max_lot_size": 1.0
    }
    """
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    # Update allowed settings
    if 'auto_sync_enabled' in data:
        connection.auto_sync_enabled = bool(data['auto_sync_enabled'])
    if 'sync_interval_seconds' in data:
        connection.sync_interval_seconds = max(10, int(data['sync_interval_seconds']))
    if 'sync_trades' in data:
        connection.sync_trades = bool(data['sync_trades'])
    if 'sync_history' in data:
        connection.sync_history = bool(data['sync_history'])
    if 'allow_trade_execution' in data:
        connection.allow_trade_execution = bool(data['allow_trade_execution'])
    if 'max_lot_size' in data:
        connection.max_lot_size = float(data['max_lot_size'])

    db.session.commit()

    return jsonify({
        'message': 'Settings updated',
        'connection': connection.to_dict()
    }), 200


@mt_bp.route('/delete/<int:connection_id>', methods=['DELETE'])
@jwt_required()
def delete_connection(connection_id):
    """Delete an MT connection permanently"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Delete from MetaAPI
        if connection.metaapi_account_id:
            result = run_async(metaapi_service.delete_account(
                connection.metaapi_account_id
            ))

        # Delete sync logs
        MTSyncLog.query.filter_by(connection_id=connection.id).delete()

        # Delete connection
        db.session.delete(connection)
        db.session.commit()

        return jsonify({
            'message': 'Connection deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@mt_bp.route('/sync-logs/<int:connection_id>', methods=['GET'])
@jwt_required()
def get_sync_logs(connection_id):
    """Get sync history for a connection"""
    current_user_id = int(get_jwt_identity())

    connection = MTConnection.query.get(connection_id)
    if not connection:
        return jsonify({'error': 'Connection not found'}), 404

    if connection.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    logs = MTSyncLog.query.filter_by(connection_id=connection.id)\
        .order_by(MTSyncLog.started_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'pages': logs.pages,
        'current_page': page
    }), 200
