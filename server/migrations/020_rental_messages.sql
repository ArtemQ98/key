-- Чат по аренде: пользовательские сообщения между владельцем и клиентом.
-- Системные события (статусы, осмотры, штрафы) НЕ дублируются сюда —
-- они читаются из rental_events и мержатся на бэкенде при выдаче треда.

CREATE TABLE IF NOT EXISTS rental_messages (
    id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('owner', 'customer', 'system')),
    body TEXT NOT NULL DEFAULT '',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rental_messages_rental_idx
    ON rental_messages(rental_id, id DESC);

CREATE INDEX IF NOT EXISTS rental_messages_unread_idx
    ON rental_messages(rental_id, sender_role)
    WHERE read_at IS NULL;