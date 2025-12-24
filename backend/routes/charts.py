"""
Chart Layout Routes for TradeSense

Provides endpoints for managing chart layouts, templates, and drawings.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, ChartLayout, ChartTemplate, ChartDrawing

charts_bp = Blueprint('charts', __name__, url_prefix='/api/charts')


# ============ LAYOUTS ============

@charts_bp.route('/layouts', methods=['GET'])
@jwt_required()
def get_layouts():
    """Get all chart layouts for current user"""
    current_user_id = int(get_jwt_identity())

    layouts = ChartLayout.query.filter_by(user_id=current_user_id).order_by(ChartLayout.updated_at.desc()).all()

    return jsonify({
        'layouts': [layout.to_dict() for layout in layouts]
    }), 200


@charts_bp.route('/layouts', methods=['POST'])
@jwt_required()
def create_layout():
    """Create a new chart layout"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    layout = ChartLayout(
        user_id=current_user_id,
        name=data['name'],
        layout_type=data.get('layout_type', '1x1'),
        charts_config=data.get('charts_config', []),
        is_default=data.get('is_default', False)
    )

    # If setting as default, unset other defaults
    if layout.is_default:
        ChartLayout.query.filter_by(user_id=current_user_id, is_default=True).update({'is_default': False})

    db.session.add(layout)
    db.session.commit()

    return jsonify({
        'message': 'Layout created',
        'layout': layout.to_dict()
    }), 201


@charts_bp.route('/layouts/<int:layout_id>', methods=['PUT'])
@jwt_required()
def update_layout(layout_id):
    """Update a chart layout"""
    current_user_id = int(get_jwt_identity())

    layout = ChartLayout.query.get(layout_id)
    if not layout:
        return jsonify({'error': 'Layout not found'}), 404

    if layout.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if 'name' in data:
        layout.name = data['name']
    if 'layout_type' in data:
        layout.layout_type = data['layout_type']
    if 'charts_config' in data:
        layout.charts_config = data['charts_config']
    if 'is_default' in data:
        if data['is_default']:
            ChartLayout.query.filter_by(user_id=current_user_id, is_default=True).update({'is_default': False})
        layout.is_default = data['is_default']

    db.session.commit()

    return jsonify({
        'message': 'Layout updated',
        'layout': layout.to_dict()
    }), 200


@charts_bp.route('/layouts/<int:layout_id>', methods=['DELETE'])
@jwt_required()
def delete_layout(layout_id):
    """Delete a chart layout"""
    current_user_id = int(get_jwt_identity())

    layout = ChartLayout.query.get(layout_id)
    if not layout:
        return jsonify({'error': 'Layout not found'}), 404

    if layout.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(layout)
    db.session.commit()

    return jsonify({'message': 'Layout deleted'}), 200


# ============ TEMPLATES ============

@charts_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_templates():
    """Get all chart templates for current user"""
    current_user_id = int(get_jwt_identity())

    # Get user's templates and public templates
    templates = ChartTemplate.query.filter(
        (ChartTemplate.user_id == current_user_id) | (ChartTemplate.is_public == True)
    ).order_by(ChartTemplate.updated_at.desc()).all()

    return jsonify({
        'templates': [template.to_dict() for template in templates]
    }), 200


@charts_bp.route('/templates', methods=['POST'])
@jwt_required()
def create_template():
    """Create a new chart template"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    template = ChartTemplate(
        user_id=current_user_id,
        name=data['name'],
        description=data.get('description'),
        indicators=data.get('indicators', []),
        drawing_tools=data.get('drawing_tools', {}),
        chart_style=data.get('chart_style', {}),
        is_public=data.get('is_public', False)
    )

    db.session.add(template)
    db.session.commit()

    return jsonify({
        'message': 'Template created',
        'template': template.to_dict()
    }), 201


@charts_bp.route('/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_template(template_id):
    """Update a chart template"""
    current_user_id = int(get_jwt_identity())

    template = ChartTemplate.query.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404

    if template.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if 'name' in data:
        template.name = data['name']
    if 'description' in data:
        template.description = data['description']
    if 'indicators' in data:
        template.indicators = data['indicators']
    if 'drawing_tools' in data:
        template.drawing_tools = data['drawing_tools']
    if 'chart_style' in data:
        template.chart_style = data['chart_style']
    if 'is_public' in data:
        template.is_public = data['is_public']

    db.session.commit()

    return jsonify({
        'message': 'Template updated',
        'template': template.to_dict()
    }), 200


@charts_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
def delete_template(template_id):
    """Delete a chart template"""
    current_user_id = int(get_jwt_identity())

    template = ChartTemplate.query.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404

    if template.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(template)
    db.session.commit()

    return jsonify({'message': 'Template deleted'}), 200


# ============ DRAWINGS ============

@charts_bp.route('/drawings', methods=['GET'])
@jwt_required()
def get_drawings():
    """Get drawings for a specific symbol/timeframe"""
    current_user_id = int(get_jwt_identity())

    symbol = request.args.get('symbol')
    timeframe = request.args.get('timeframe')

    query = ChartDrawing.query.filter_by(user_id=current_user_id)

    if symbol:
        query = query.filter_by(symbol=symbol)
    if timeframe:
        query = query.filter_by(timeframe=timeframe)

    drawings = query.order_by(ChartDrawing.created_at.desc()).all()

    return jsonify({
        'drawings': [drawing.to_dict() for drawing in drawings]
    }), 200


@charts_bp.route('/drawings', methods=['POST'])
@jwt_required()
def create_drawing():
    """Save a new chart drawing"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    required = ['symbol', 'timeframe', 'drawing_type', 'drawing_data']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    drawing = ChartDrawing(
        user_id=current_user_id,
        symbol=data['symbol'],
        timeframe=data['timeframe'],
        drawing_type=data['drawing_type'],
        drawing_data=data['drawing_data'],
        is_visible=data.get('is_visible', True),
        is_locked=data.get('is_locked', False)
    )

    db.session.add(drawing)
    db.session.commit()

    return jsonify({
        'message': 'Drawing saved',
        'drawing': drawing.to_dict()
    }), 201


@charts_bp.route('/drawings/<int:drawing_id>', methods=['PUT'])
@jwt_required()
def update_drawing(drawing_id):
    """Update a chart drawing"""
    current_user_id = int(get_jwt_identity())

    drawing = ChartDrawing.query.get(drawing_id)
    if not drawing:
        return jsonify({'error': 'Drawing not found'}), 404

    if drawing.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if 'drawing_data' in data:
        drawing.drawing_data = data['drawing_data']
    if 'is_visible' in data:
        drawing.is_visible = data['is_visible']
    if 'is_locked' in data:
        drawing.is_locked = data['is_locked']

    db.session.commit()

    return jsonify({
        'message': 'Drawing updated',
        'drawing': drawing.to_dict()
    }), 200


@charts_bp.route('/drawings/<int:drawing_id>', methods=['DELETE'])
@jwt_required()
def delete_drawing(drawing_id):
    """Delete a chart drawing"""
    current_user_id = int(get_jwt_identity())

    drawing = ChartDrawing.query.get(drawing_id)
    if not drawing:
        return jsonify({'error': 'Drawing not found'}), 404

    if drawing.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(drawing)
    db.session.commit()

    return jsonify({'message': 'Drawing deleted'}), 200


@charts_bp.route('/drawings/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_drawings():
    """Delete multiple drawings at once"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    drawing_ids = data.get('drawing_ids', [])
    if not drawing_ids:
        return jsonify({'error': 'No drawing IDs provided'}), 400

    deleted_count = ChartDrawing.query.filter(
        ChartDrawing.id.in_(drawing_ids),
        ChartDrawing.user_id == current_user_id
    ).delete(synchronize_session=False)

    db.session.commit()

    return jsonify({
        'message': f'{deleted_count} drawings deleted'
    }), 200
