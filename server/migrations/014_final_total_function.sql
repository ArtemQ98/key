CREATE OR REPLACE FUNCTION calculate_rental_final_total(rental_id BIGINT)
RETURNS NUMERIC AS $$
    SELECT GREATEST(
        COALESCE(r.amount, 0)
        + COALESCE((SELECT SUM(total) FROM rental_extras WHERE rental_id = r.id), 0)
        + COALESCE((
            SELECT SUM(
                CASE
                    WHEN adjustment_type IN ('late_fee','damage_fee','other') THEN amount
                    ELSE -amount  -- discount
                END
            )
            FROM rental_adjustments
            WHERE rental_id = r.id
        ), 0),
        0
    )
    FROM rentals r
    WHERE r.id = rental_id;
$$ LANGUAGE SQL STABLE;