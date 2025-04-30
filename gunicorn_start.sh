#!/bin/bash

# ==========================================
# FILE: gunicorn_start.sh
# UNTUK: rumahakrilik.id
# CARA PAKAI:
# 1. Simpan file ini di /root/rumah-akrilik/
# 2. chmod +x gunicorn_start.sh
# 3. Jalankan dengan: pm2 start gunicorn_start.sh --name django
# ==========================================

# ==========================================
# KONFIGURASI APLIKASI DJANGO GUINCORN
# ==========================================

# Konfigurasi Dasar
APP_NAME="django_simple"
PROJECT_DIR="/root/rumah-akrilik"
VENV_DIR="$PROJECT_DIR/venv"
LOG_DIR="$PROJECT_DIR/logs"

# Setup Environment
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"

# Jalankan Gunicorn dengan config minimal
exec "$VENV_DIR/bin/gunicorn" \
    --bind "0.0.0.0:8001" \
    --workers 3 \
    --worker-class "sync" \
    --log-level "info" \
    --access-logfile "$LOG_DIR/gunicorn-access.log" \
    --error-logfile "$LOG_DIR/gunicorn-error.log" \
    backend.wsgi:application
