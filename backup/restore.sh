#!/bin/sh
set -e

if [ -z "$1" ]; then
    echo "Usage: restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /backups/key_*.sql.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

FILE="$1"
if [ ! -f "${FILE}" ]; then
    echo "File not found: ${FILE}"
    exit 1
fi

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-key}"
DB_NAME="${DB_NAME:-key}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

echo "WARNING: this will DROP and recreate all data in database '${DB_NAME}' on ${DB_HOST}"
printf "Continue? [y/N] "
read -r CONFIRM
if [ "${CONFIRM}" != "y" ] && [ "${CONFIRM}" != "Y" ]; then
    echo "Aborted"
    exit 0
fi

echo "Restoring ${FILE}..."

gunzip -c "${FILE}" | psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --quiet

echo "Restore complete"