#!/bin/bash

# ==========================================
# KONFIGURASI DASAR
# ==========================================
APP_NAME="django_simple"
PROJECT_DIR="/root/rumah-akrilik"
VENV_DIR="$PROJECT_DIR/venv"
LOG_DIR="$PROJECT_DIR/logs"

# ==========================================
# SETUP ENVIRONMENT
# ==========================================
echo "Membuat direktori log..."
mkdir -p "$LOG_DIR"
touch "$LOG_DIR/gunicorn-access.log"
touch "$LOG_DIR/gunicorn-error.log"

echo "Masuk ke direktori project..."
cd "$PROJECT_DIR" || { echo "Gagal masuk ke $PROJECT_DIR"; exit 1; }

echo "Mengaktifkan virtual environment..."
source "$VENV_DIR/bin/activate" || { echo "Gagal mengaktifkan virtualenv"; exit 1; }

# ==========================================
# JALANKAN GUNICORN
# ==========================================
echo "Memulai Gunicorn..."
exec "$VENV_DIR/bin/gunicorn" \
    --bind "0.0.0.0:8000" \
    --workers 3 \
    --worker-class "sync" \
    --log-level "info" \
    --access-logfile "$LOG_DIR/gunicorn-access.log" \
    --error-logfile "$LOG_DIR/gunicorn-error.log" \
    backend.wsgi:application

# ==========================================
# CATATAN:
# 1. Pastikan file ini disimpan di /root/rumah-akrilik/
# 2. Beri permission dengan: chmod +x gunicorn_simple.sh
# 3. Jalankan dengan PM2: pm2 start gunicorn_simple.sh --name django_simple
# ==========================================
