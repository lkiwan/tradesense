"""
KYC (Know Your Customer) Routes
Handles user verification endpoints
"""

import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, KYCData, KYCDocument, KYCHistory, KYCStatus, KYC_TIER_LIMITS
from services.storage_service import StorageService
from services.audit_service import AuditService

logger = logging.getLogger(__name__)

kyc_bp = Blueprint('kyc', __name__, url_prefix='/api/kyc')


@kyc_bp.route('/status', methods=['GET'])
@jwt_required()
def get_kyc_status():
    """Get current user's KYC status"""
    current_user_id = int(get_jwt_identity())

    kyc = KYCData.get_or_create(current_user_id)
    user = User.query.get(current_user_id)

    # Check if email is verified for tier 1
    if user.email_verified and kyc.current_tier == 0:
        kyc.current_tier = 1
        kyc.status = KYCStatus.APPROVED.value
        db.session.commit()

    return jsonify({
        'kyc': kyc.to_dict(include_documents=True),
        'tier_limits': {
            0: 0,
            1: 500,
            2: 5000,
            3: 25000,
            4: None  # Unlimited
        },
        'next_tier_info': kyc.get_next_tier_info(),
        'email_verified': user.email_verified
    }), 200


@kyc_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_kyc():
    """Submit KYC information"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    kyc = KYCData.get_or_create(current_user_id)

    # Update personal information
    if 'first_name' in data:
        kyc.first_name = data['first_name']
    if 'last_name' in data:
        kyc.last_name = data['last_name']
    if 'date_of_birth' in data:
        try:
            kyc.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    if 'nationality' in data:
        kyc.nationality = data['nationality']
    if 'country_of_residence' in data:
        kyc.country_of_residence = data['country_of_residence']

    # Update address
    if 'address_line_1' in data:
        kyc.address_line_1 = data['address_line_1']
    if 'address_line_2' in data:
        kyc.address_line_2 = data['address_line_2']
    if 'city' in data:
        kyc.city = data['city']
    if 'state_province' in data:
        kyc.state_province = data['state_province']
    if 'postal_code' in data:
        kyc.postal_code = data['postal_code']

    # Update ID info
    if 'id_type' in data:
        kyc.id_type = data['id_type']
    if 'id_number' in data:
        kyc.id_number = data['id_number']
    if 'id_expiry_date' in data:
        try:
            kyc.id_expiry_date = datetime.strptime(data['id_expiry_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    if 'id_issuing_country' in data:
        kyc.id_issuing_country = data['id_issuing_country']

    # Update phone
    if 'phone_number' in data:
        kyc.phone_number = data['phone_number']

    # Update status to pending if submitting for review
    if data.get('submit_for_review'):
        kyc.status = KYCStatus.PENDING.value
        kyc.submitted_at = datetime.utcnow()

        # Log submission
        try:
            user = User.query.get(current_user_id)
            AuditService.log_action(
                action_type='SECURITY',
                action='kyc_submitted',
                user_id=current_user_id,
                username=user.username if user else None,
                description=f'KYC submitted for review (Tier {kyc.current_tier} -> {kyc.current_tier + 1})'
            )
        except Exception as e:
            logger.warning(f"Failed to log KYC submission: {e}")

    db.session.commit()

    return jsonify({
        'message': 'KYC information updated successfully',
        'kyc': kyc.to_dict()
    }), 200


@kyc_bp.route('/upload-document', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload a KYC document"""
    current_user_id = int(get_jwt_identity())

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    document_type = request.form.get('document_type', 'id_document')
    document_side = request.form.get('document_side', 'front')

    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Upload file
        file_info = StorageService.upload_kyc_document(
            file=file,
            user_id=current_user_id,
            document_type=document_type
        )

        # Get or create KYC data
        kyc = KYCData.get_or_create(current_user_id)

        # Check if document of same type already exists
        existing_doc = KYCDocument.query.filter_by(
            kyc_id=kyc.id,
            document_type=document_type,
            document_side=document_side
        ).first()

        if existing_doc:
            # Delete old file
            StorageService.delete_file(existing_doc.file_path)
            # Update existing document
            existing_doc.file_name = file_info['file_name']
            existing_doc.file_path = file_info['file_path']
            existing_doc.file_type = file_info['file_type']
            existing_doc.file_size = file_info['file_size']
            existing_doc.status = 'pending'
            existing_doc.rejection_reason = None
            existing_doc.uploaded_at = datetime.utcnow()
            document = existing_doc
        else:
            # Create new document record
            document = KYCDocument(
                kyc_id=kyc.id,
                document_type=document_type,
                document_side=document_side,
                file_name=file_info['file_name'],
                file_path=file_info['file_path'],
                file_type=file_info['file_type'],
                file_size=file_info['file_size']
            )
            db.session.add(document)

        db.session.commit()

        return jsonify({
            'message': 'Document uploaded successfully',
            'document': document.to_dict()
        }), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        return jsonify({'error': 'Failed to upload document'}), 500


@kyc_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
@jwt_required()
def delete_document(doc_id):
    """Delete a KYC document"""
    current_user_id = int(get_jwt_identity())

    document = KYCDocument.query.get(doc_id)
    if not document:
        return jsonify({'error': 'Document not found'}), 404

    # Verify ownership
    kyc = KYCData.query.get(document.kyc_id)
    if kyc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Can only delete pending documents
    if document.status == 'approved':
        return jsonify({'error': 'Cannot delete approved documents'}), 400

    # Delete file from storage
    StorageService.delete_file(document.file_path)

    # Delete record
    db.session.delete(document)
    db.session.commit()

    return jsonify({'message': 'Document deleted successfully'}), 200


@kyc_bp.route('/history', methods=['GET'])
@jwt_required()
def get_kyc_history():
    """Get KYC status change history"""
    current_user_id = int(get_jwt_identity())

    kyc = KYCData.query.filter_by(user_id=current_user_id).first()
    if not kyc:
        return jsonify({'history': []}), 200

    history = KYCHistory.query.filter_by(kyc_id=kyc.id).order_by(
        KYCHistory.created_at.desc()
    ).all()

    return jsonify({
        'history': [h.to_dict() for h in history]
    }), 200


# ==================== ADMIN ENDPOINTS ====================

@kyc_bp.route('/admin/pending', methods=['GET'])
@jwt_required()
def get_pending_kyc():
    """Get all pending KYC submissions (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status', 'pending')

    query = KYCData.query

    if status_filter:
        query = query.filter(KYCData.status == status_filter)

    query = query.order_by(KYCData.submitted_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'kyc_submissions': [k.to_dict(include_documents=True) for k in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@kyc_bp.route('/admin/<int:kyc_id>', methods=['GET'])
@jwt_required()
def get_kyc_detail(kyc_id):
    """Get detailed KYC information (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    kyc = KYCData.query.get(kyc_id)
    if not kyc:
        return jsonify({'error': 'KYC record not found'}), 404

    # Get user info
    kyc_user = User.query.get(kyc.user_id)

    # Get history
    history = KYCHistory.query.filter_by(kyc_id=kyc.id).order_by(
        KYCHistory.created_at.desc()
    ).limit(10).all()

    return jsonify({
        'kyc': kyc.to_dict(include_documents=True),
        'user': {
            'id': kyc_user.id,
            'username': kyc_user.username,
            'email': kyc_user.email,
            'email_verified': kyc_user.email_verified,
            'created_at': kyc_user.created_at.isoformat() if kyc_user.created_at else None
        },
        'history': [h.to_dict() for h in history]
    }), 200


@kyc_bp.route('/admin/<int:kyc_id>/document/<int:doc_id>', methods=['GET'])
@jwt_required()
def view_document(kyc_id, doc_id):
    """View/download a KYC document (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    document = KYCDocument.query.get(doc_id)
    if not document or document.kyc_data.id != kyc_id:
        return jsonify({'error': 'Document not found'}), 404

    if not StorageService.file_exists(document.file_path):
        return jsonify({'error': 'File not found on server'}), 404

    return send_file(
        document.file_path,
        as_attachment=False,
        download_name=document.file_name
    )


@kyc_bp.route('/admin/<int:kyc_id>/approve', methods=['POST'])
@jwt_required()
def approve_kyc(kyc_id):
    """Approve KYC and upgrade tier (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    kyc = KYCData.query.get(kyc_id)
    if not kyc:
        return jsonify({'error': 'KYC record not found'}), 404

    if kyc.status != KYCStatus.PENDING.value:
        return jsonify({'error': 'KYC is not pending review'}), 400

    data = request.get_json() or {}
    new_tier = data.get('tier', kyc.current_tier + 1)
    notes = data.get('notes', '')

    # Validate tier
    if new_tier > 4:
        new_tier = 4

    old_tier = kyc.current_tier
    old_status = kyc.status

    # Update KYC
    kyc.current_tier = new_tier
    kyc.status = KYCStatus.APPROVED.value
    kyc.reviewed_by = current_user_id
    kyc.reviewed_at = datetime.utcnow()
    kyc.approved_at = datetime.utcnow()
    kyc.review_notes = notes
    kyc.rejection_reason = None

    # Approve all pending documents
    for doc in kyc.documents:
        if doc.status == 'pending':
            doc.status = 'approved'
            doc.reviewed_by = current_user_id
            doc.reviewed_at = datetime.utcnow()

    # Log history
    history = KYCHistory(
        kyc_id=kyc.id,
        user_id=kyc.user_id,
        action='approved',
        old_tier=old_tier,
        new_tier=new_tier,
        old_status=old_status,
        new_status=KYCStatus.APPROVED.value,
        notes=notes,
        performed_by=current_user_id
    )
    db.session.add(history)
    db.session.commit()

    # Audit log
    try:
        kyc_user = User.query.get(kyc.user_id)
        AuditService.log_action(
            action_type='ADMIN',
            action='kyc_approved',
            user_id=current_user_id,
            username=user.username,
            target_type='kyc',
            target_id=kyc_id,
            description=f'Approved KYC for user {kyc_user.username} (Tier {old_tier} -> {new_tier})'
        )
    except Exception as e:
        logger.warning(f"Failed to log KYC approval: {e}")

    return jsonify({
        'message': f'KYC approved. User upgraded to Tier {new_tier}',
        'kyc': kyc.to_dict()
    }), 200


@kyc_bp.route('/admin/<int:kyc_id>/reject', methods=['POST'])
@jwt_required()
def reject_kyc(kyc_id):
    """Reject KYC submission (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    kyc = KYCData.query.get(kyc_id)
    if not kyc:
        return jsonify({'error': 'KYC record not found'}), 404

    if kyc.status != KYCStatus.PENDING.value:
        return jsonify({'error': 'KYC is not pending review'}), 400

    data = request.get_json() or {}
    reason = data.get('reason', 'Documents not acceptable')
    rejected_doc_ids = data.get('rejected_documents', [])

    old_status = kyc.status

    # Update KYC
    kyc.status = KYCStatus.REJECTED.value
    kyc.reviewed_by = current_user_id
    kyc.reviewed_at = datetime.utcnow()
    kyc.rejection_reason = reason

    # Reject specified documents or all pending
    for doc in kyc.documents:
        if doc.status == 'pending':
            if not rejected_doc_ids or doc.id in rejected_doc_ids:
                doc.status = 'rejected'
                doc.rejection_reason = reason
                doc.reviewed_by = current_user_id
                doc.reviewed_at = datetime.utcnow()

    # Log history
    history = KYCHistory(
        kyc_id=kyc.id,
        user_id=kyc.user_id,
        action='rejected',
        old_tier=kyc.current_tier,
        new_tier=kyc.current_tier,
        old_status=old_status,
        new_status=KYCStatus.REJECTED.value,
        notes=reason,
        performed_by=current_user_id
    )
    db.session.add(history)
    db.session.commit()

    # Audit log
    try:
        kyc_user = User.query.get(kyc.user_id)
        AuditService.log_action(
            action_type='ADMIN',
            action='kyc_rejected',
            user_id=current_user_id,
            username=user.username,
            target_type='kyc',
            target_id=kyc_id,
            description=f'Rejected KYC for user {kyc_user.username}: {reason}'
        )
    except Exception as e:
        logger.warning(f"Failed to log KYC rejection: {e}")

    return jsonify({
        'message': 'KYC rejected',
        'kyc': kyc.to_dict()
    }), 200


@kyc_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_kyc_stats():
    """Get KYC statistics (Admin only)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)

    if user.role not in ['admin', 'superadmin']:
        return jsonify({'error': 'Unauthorized'}), 403

    # Count by status
    pending = KYCData.query.filter_by(status=KYCStatus.PENDING.value).count()
    approved = KYCData.query.filter_by(status=KYCStatus.APPROVED.value).count()
    rejected = KYCData.query.filter_by(status=KYCStatus.REJECTED.value).count()

    # Count by tier
    tier_counts = {}
    for tier in range(5):
        tier_counts[f'tier_{tier}'] = KYCData.query.filter_by(current_tier=tier).count()

    return jsonify({
        'status_counts': {
            'pending': pending,
            'approved': approved,
            'rejected': rejected
        },
        'tier_counts': tier_counts,
        'total_submissions': pending + approved + rejected
    }), 200
