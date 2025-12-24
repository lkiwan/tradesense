"""
KYC (Know Your Customer) Data Model
Manages user verification levels and document submissions
"""

from datetime import datetime
from enum import Enum
from models import db


class KYCTier(Enum):
    """KYC verification tiers with associated limits"""
    TIER_0 = 0  # Unverified - No payouts allowed
    TIER_1 = 1  # Email verified - $500/month limit
    TIER_2 = 2  # ID verified - $5,000/month limit
    TIER_3 = 3  # Address verified - $25,000/month limit
    TIER_4 = 4  # Full KYC - Unlimited


class KYCStatus(Enum):
    """Status of KYC submission"""
    NOT_STARTED = 'not_started'
    PENDING = 'pending'
    UNDER_REVIEW = 'under_review'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXPIRED = 'expired'


class DocumentType(Enum):
    """Types of documents for KYC"""
    PASSPORT = 'passport'
    NATIONAL_ID = 'national_id'
    DRIVERS_LICENSE = 'drivers_license'
    UTILITY_BILL = 'utility_bill'
    BANK_STATEMENT = 'bank_statement'
    PROOF_OF_ADDRESS = 'proof_of_address'
    SELFIE = 'selfie'
    SELFIE_WITH_ID = 'selfie_with_id'


# KYC Tier limits (in USD per month)
KYC_TIER_LIMITS = {
    KYCTier.TIER_0.value: 0,
    KYCTier.TIER_1.value: 500,
    KYCTier.TIER_2.value: 5000,
    KYCTier.TIER_3.value: 25000,
    KYCTier.TIER_4.value: float('inf')  # Unlimited
}

# Required documents per tier
KYC_TIER_REQUIREMENTS = {
    KYCTier.TIER_1.value: ['email_verification'],
    KYCTier.TIER_2.value: ['id_document', 'selfie'],
    KYCTier.TIER_3.value: ['proof_of_address'],
    KYCTier.TIER_4.value: ['enhanced_due_diligence']
}


class KYCData(db.Model):
    """Main KYC data for users"""
    __tablename__ = 'kyc_data'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)

    # Current verification level
    current_tier = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default=KYCStatus.NOT_STARTED.value)

    # Personal information
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    nationality = db.Column(db.String(100))
    country_of_residence = db.Column(db.String(100))

    # Address
    address_line_1 = db.Column(db.String(200))
    address_line_2 = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state_province = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))

    # ID Information
    id_type = db.Column(db.String(50))
    id_number = db.Column(db.String(100))
    id_expiry_date = db.Column(db.Date)
    id_issuing_country = db.Column(db.String(100))

    # Phone number
    phone_number = db.Column(db.String(30))
    phone_verified = db.Column(db.Boolean, default=False)

    # Tax information
    tax_id_number = db.Column(db.String(100))
    tax_residence_country = db.Column(db.String(100))

    # Review information
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reviewed_at = db.Column(db.DateTime)
    review_notes = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    approved_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('kyc_data', uselist=False))
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    documents = db.relationship('KYCDocument', backref='kyc_data', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_documents=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'current_tier': self.current_tier,
            'tier_name': f'Tier {self.current_tier}',
            'status': self.status,
            'payout_limit': self.get_payout_limit(),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'nationality': self.nationality,
            'country_of_residence': self.country_of_residence,
            'address': {
                'line_1': self.address_line_1,
                'line_2': self.address_line_2,
                'city': self.city,
                'state_province': self.state_province,
                'postal_code': self.postal_code
            },
            'phone_number': self.phone_number,
            'phone_verified': self.phone_verified,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None
        }

        if include_documents:
            data['documents'] = [doc.to_dict() for doc in self.documents]

        return data

    def get_payout_limit(self):
        """Get monthly payout limit for current tier"""
        limit = KYC_TIER_LIMITS.get(self.current_tier, 0)
        return None if limit == float('inf') else limit

    def can_request_payout(self, amount, monthly_total=0):
        """Check if user can request a payout of given amount"""
        limit = self.get_payout_limit()

        if limit is None:  # Unlimited
            return True, None

        if limit == 0:
            return False, 'KYC verification required before requesting payouts'

        remaining = limit - monthly_total
        if amount > remaining:
            return False, f'Payout exceeds monthly limit. Remaining: ${remaining:.2f}. Upgrade KYC tier for higher limits.'

        return True, None

    def get_next_tier_info(self):
        """Get information about upgrading to next tier"""
        if self.current_tier >= 4:
            return None

        next_tier = self.current_tier + 1
        requirements = KYC_TIER_REQUIREMENTS.get(next_tier, [])
        new_limit = KYC_TIER_LIMITS.get(next_tier, 0)

        return {
            'next_tier': next_tier,
            'requirements': requirements,
            'new_limit': None if new_limit == float('inf') else new_limit
        }

    @staticmethod
    def get_or_create(user_id):
        """Get existing KYC data or create new one"""
        kyc = KYCData.query.filter_by(user_id=user_id).first()
        if not kyc:
            kyc = KYCData(user_id=user_id)
            db.session.add(kyc)
            db.session.commit()
        return kyc


class KYCDocument(db.Model):
    """KYC Document uploads"""
    __tablename__ = 'kyc_documents'

    id = db.Column(db.Integer, primary_key=True)
    kyc_id = db.Column(db.Integer, db.ForeignKey('kyc_data.id', ondelete='CASCADE'), nullable=False)

    # Document info
    document_type = db.Column(db.String(50), nullable=False)
    document_side = db.Column(db.String(20))  # front, back

    # File info
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)  # Path or URL
    file_type = db.Column(db.String(50))  # mime type
    file_size = db.Column(db.Integer)  # in bytes

    # Verification
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    rejection_reason = db.Column(db.Text)

    # Review
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reviewed_at = db.Column(db.DateTime)

    # Timestamps
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

    def to_dict(self, include_path=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'document_type': self.document_type,
            'document_side': self.document_side,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }

        if include_path:
            data['file_path'] = self.file_path

        return data


class KYCHistory(db.Model):
    """History of KYC status changes"""
    __tablename__ = 'kyc_history'

    id = db.Column(db.Integer, primary_key=True)
    kyc_id = db.Column(db.Integer, db.ForeignKey('kyc_data.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Change info
    action = db.Column(db.String(50), nullable=False)  # submitted, approved, rejected, tier_upgrade, expired
    old_tier = db.Column(db.Integer)
    new_tier = db.Column(db.Integer)
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))

    # Details
    notes = db.Column(db.Text)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'old_tier': self.old_tier,
            'new_tier': self.new_tier,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
