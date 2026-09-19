-- Тарифы и лимиты для владельцев

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS cars_limit INT NOT NULL DEFAULT 3;

-- Проверка допустимых значений плана
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_plan_check'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_plan_check
            CHECK (plan IN ('free', 'pro', 'business', 'enterprise'));
    END IF;
END $$;

-- Платежи (пока пустая — заполнится при интеграции эквайринга)
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,
    external_id     TEXT,
    amount          NUMERIC(12,2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'RUB',
    plan            TEXT NOT NULL,
    period_months   INT NOT NULL DEFAULT 1,
    status          TEXT NOT NULL DEFAULT 'pending',
    idempotency_key TEXT UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at         TIMESTAMPTZ,
    raw_payload     JSONB
);

CREATE INDEX IF NOT EXISTS payments_owner_idx ON payments(owner_id);
CREATE INDEX IF NOT EXISTS payments_external_idx ON payments(provider, external_id);

-- Обновить существующих владельцев: у кого <= 3 машин — free, иначе pro
UPDATE users u
SET plan = CASE
    WHEN (SELECT count(*) FROM cars c WHERE c.owner_id = u.id) > 12 THEN 'business'
    WHEN (SELECT count(*) FROM cars c WHERE c.owner_id = u.id) > 3 THEN 'pro'
    ELSE 'free'
END,
cars_limit = CASE
    WHEN (SELECT count(*) FROM cars c WHERE c.owner_id = u.id) > 12 THEN 24
    WHEN (SELECT count(*) FROM cars c WHERE c.owner_id = u.id) > 3 THEN 12
    ELSE 3
END
WHERE u.role = 'owner';