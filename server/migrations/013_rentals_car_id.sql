-- Привязка rentals к cars по car_id вместо сравнения по имени.
-- Существующие rentals подтягиваются по совпадению car_name с brand||' '||model
-- в рамках одного owner_id.

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS car_id BIGINT;

-- Backfill: связываем старые записи по имени машины и владельцу.
UPDATE rentals r
SET car_id = c.id
FROM cars c
WHERE r.car_id IS NULL
  AND r.owner_id = c.owner_id
  AND lower(trim(r.car_name)) = lower(trim(c.brand || ' ' || c.model));

-- Индекс для джойнов и проверки пересечений.
CREATE INDEX IF NOT EXISTS rentals_car_id_idx ON rentals (car_id);

-- Индекс для календаря: ищем брони по машине в диапазоне дат.
CREATE INDEX IF NOT EXISTS rentals_car_dates_idx
    ON rentals (car_id, starts_at, ends_at)
    WHERE status NOT IN ('cancelled', 'rejected', 'expired');

-- FK на cars с RESTRICT: нельзя удалить машину, если на неё есть rentals.
-- ON DELETE SET NULL был бы мягче, но тогда история аренд потеряет машину.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rentals_car_id_fkey'
    ) THEN
        ALTER TABLE rentals
            ADD CONSTRAINT rentals_car_id_fkey
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
    END IF;
END $$;