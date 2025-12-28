#!/bin/bash
# Build script for Render deployment

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
flask db upgrade

echo "Build complete!"
