ALTER TABLE auth_codes
    ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS auth_codes_email_active_idx
    ON auth_codes (email) WHERE used_at IS NULL;