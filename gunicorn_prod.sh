#!/bin/bash

# Konfigurasi
APP_NAME="django_prod"
PROJECT_DIR="/root/rumah-akrilik"
VENV_DIR="$PROJECT_DIR/venv"
LOG_DIR="$PROJECT_DIR/logs"
WORKERS=$(( $(nproc) * 2 + 1 ))  # Optimal worker count

# Setup environment
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR" || exit 1
source "$VENV_DIR/bin/activate"

# Jalankan Gunicorn
exec "$VENV_DIR/bin/gunicorn" \
    --bind "unix:/tmp/gunicorn.sock" \
    --workers "$WORKERS" \
    --worker-class "gevent" \
    --timeout 120 \
    --log-level "info" \
    --access-logfile "$LOG_DIR/gunicorn-access.log" \
    --error-logfile "$LOG_DIR/gunicorn-error.log" \
    --preload \
    backend.wsgi:application
