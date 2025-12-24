"""
Storage Service
Handles file uploads for KYC documents and other files
Supports local storage with optional S3/cloud integration
"""

import os
import uuid
import hashlib
import logging
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import current_app

logger = logging.getLogger(__name__)

# Allowed file extensions for documents
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class StorageService:
    """File storage service with local and cloud support"""

    @staticmethod
    def get_upload_folder():
        """Get the upload folder path"""
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        if not os.path.isabs(upload_folder):
            upload_folder = os.path.join(current_app.root_path, upload_folder)
        return upload_folder

    @staticmethod
    def ensure_folder_exists(folder_path):
        """Create folder if it doesn't exist"""
        if not os.path.exists(folder_path):
            os.makedirs(folder_path, exist_ok=True)

    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def get_file_extension(filename):
        """Get file extension from filename"""
        if '.' in filename:
            return filename.rsplit('.', 1)[1].lower()
        return ''

    @staticmethod
    def generate_unique_filename(original_filename, prefix=''):
        """Generate a unique filename while preserving extension"""
        ext = StorageService.get_file_extension(original_filename)
        unique_id = str(uuid.uuid4())[:8]
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

        if prefix:
            return f"{prefix}_{timestamp}_{unique_id}.{ext}"
        return f"{timestamp}_{unique_id}.{ext}"

    @staticmethod
    def calculate_file_hash(file_data):
        """Calculate MD5 hash of file for duplicate detection"""
        return hashlib.md5(file_data).hexdigest()

    @classmethod
    def upload_kyc_document(cls, file, user_id, document_type):
        """
        Upload a KYC document

        Args:
            file: FileStorage object from Flask request
            user_id: ID of the user uploading
            document_type: Type of document (passport, id, utility_bill, etc.)

        Returns:
            dict: Contains file_path, file_name, file_size, file_type
        """
        if not file or not file.filename:
            raise ValueError('No file provided')

        original_filename = secure_filename(file.filename)

        if not cls.allowed_file(original_filename):
            raise ValueError(f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}')

        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning

        if file_size > MAX_FILE_SIZE:
            raise ValueError(f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB')

        # Generate unique filename
        unique_filename = cls.generate_unique_filename(
            original_filename,
            prefix=f"kyc_{user_id}_{document_type}"
        )

        # Create user-specific KYC folder
        upload_folder = cls.get_upload_folder()
        kyc_folder = os.path.join(upload_folder, 'kyc', str(user_id))
        cls.ensure_folder_exists(kyc_folder)

        # Full file path
        file_path = os.path.join(kyc_folder, unique_filename)

        # Save file
        file.save(file_path)

        # Return file info
        return {
            'file_path': file_path,
            'file_name': unique_filename,
            'original_name': original_filename,
            'file_size': file_size,
            'file_type': file.content_type or f'image/{cls.get_file_extension(original_filename)}'
        }

    @classmethod
    def delete_file(cls, file_path):
        """Delete a file from storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
                return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
        return False

    @classmethod
    def get_file_url(cls, file_path, secure=True):
        """
        Get URL for accessing a file

        For local storage, returns a relative path
        For S3/cloud, would return a signed URL
        """
        # For local storage, return relative path from uploads folder
        upload_folder = cls.get_upload_folder()
        if file_path.startswith(upload_folder):
            relative_path = file_path[len(upload_folder):].lstrip(os.sep)
            return f"/uploads/{relative_path.replace(os.sep, '/')}"
        return file_path

    @classmethod
    def file_exists(cls, file_path):
        """Check if file exists"""
        return os.path.exists(file_path)

    @classmethod
    def get_file_size(cls, file_path):
        """Get file size in bytes"""
        if os.path.exists(file_path):
            return os.path.getsize(file_path)
        return 0

    @classmethod
    def cleanup_user_files(cls, user_id):
        """Clean up all files for a user (for account deletion)"""
        import shutil
        upload_folder = cls.get_upload_folder()
        user_folder = os.path.join(upload_folder, 'kyc', str(user_id))

        if os.path.exists(user_folder):
            try:
                shutil.rmtree(user_folder)
                logger.info(f"Cleaned up files for user {user_id}")
                return True
            except Exception as e:
                logger.error(f"Error cleaning up user files: {e}")
        return False


class S3StorageService(StorageService):
    """
    S3-compatible cloud storage service
    To be implemented when moving to production with AWS S3 or compatible service
    """

    @classmethod
    def upload_to_s3(cls, file, bucket, key):
        """Upload file to S3 bucket"""
        # TODO: Implement S3 upload when needed
        # import boto3
        # s3_client = boto3.client('s3')
        # s3_client.upload_fileobj(file, bucket, key)
        raise NotImplementedError("S3 upload not yet implemented")

    @classmethod
    def get_signed_url(cls, bucket, key, expiration=3600):
        """Get a pre-signed URL for S3 object"""
        # TODO: Implement when needed
        raise NotImplementedError("S3 signed URL not yet implemented")

    @classmethod
    def delete_from_s3(cls, bucket, key):
        """Delete object from S3"""
        # TODO: Implement when needed
        raise NotImplementedError("S3 delete not yet implemented")
