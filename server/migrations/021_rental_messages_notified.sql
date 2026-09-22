ALTER TABLE rental_messages
    ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS rental_messages_pending_notify_idx
    ON rental_messages (created_at)
    WHERE read_at IS NULL AND notified_at IS NULL;