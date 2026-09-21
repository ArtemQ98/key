FROM postgres:17-alpine

# Install curl (для будущей заливки в облако)
RUN apk add --no-cache curl tzdata

# Копируем скрипты
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh

# Entrypoint: cron + скрипт
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]