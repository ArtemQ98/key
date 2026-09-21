#!/bin/sh
set -e

# === Schedule ===
# По умолчанию: каждый день в 03:00
SCHEDULE="${BACKUP_SCHEDULE:-0 3 * * *}"

# Создаём cron-задачу
echo "${SCHEDULE} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

# Логи cron в stdout — чтобы docker logs их показывал
ln -sf /dev/stdout /var/log/backup.log

echo "Backup cron started with schedule: ${SCHEDULE}"
echo "Timezone: $(date +%Z)"

# Запускаем cron в foreground
exec crond -f -l 2