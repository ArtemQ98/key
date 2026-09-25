ALTER TABLE user_notifications
    ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

ALTER TABLE user_notifications
    ADD COLUMN IF NOT EXISTS rental_id BIGINT REFERENCES rentals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_notifications_pending_idx
    ON user_notifications (created_at)
    WHERE notified_at IS NULL AND is_read = FALSE;