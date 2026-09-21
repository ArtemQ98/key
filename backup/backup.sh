#!/bin/sh
set -e

# === Config ===
BACKUP_DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-key}"
DB_NAME="${DB_NAME:-key}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="key_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup → ${FILENAME}"

# === Dump ===
pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip > "${FILEPATH}"

# Check size
SIZE=$(stat -c%s "${FILEPATH}" 2>/dev/null || stat -f%z "${FILEPATH}")
if [ "${SIZE}" -lt 1024 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: backup too small (${SIZE} bytes), removing"
    rm -f "${FILEPATH}"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup created: ${FILENAME} ($(numfmt --to=iec "${SIZE}" 2>/dev/null || echo "${SIZE}B"))"

# === Rotate old backups ===
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removing backups older than ${KEEP_DAYS} days"
find "${BACKUP_DIR}" -name "key_*.sql.gz" -type f -mtime "+${KEEP_DAYS}" -print -delete

# === Show current state ===
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Current backups:"
ls -lh "${BACKUP_DIR}"/key_*.sql.gz 2>/dev/null || echo "  (none)"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done"