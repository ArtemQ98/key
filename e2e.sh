#!/bin/bash
set -e

API="http://localhost:8080/api"
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶ $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

ok() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ============ OWNER ============
step "1. Регистрация владельца"
OWNER=$(curl -s -X POST $API/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Иван Владелец","phone":"+79990000001","password":"password123","company_name":"E2E Fleet"}')
OWNER_TOKEN=$(echo $OWNER | jq -r .token)
OWNER_ID=$(echo $OWNER | jq -r .user.id)
[ "$OWNER_TOKEN" != "null" ] || fail "Не получили токен владельца"
ok "Владелец ID=$OWNER_ID"

step "2. Проверка /me владельца"
ME=$(curl -s $API/me -H "Authorization: Bearer $OWNER_TOKEN")
PLAN=$(echo $ME | jq -r .plan)
LIMIT=$(echo $ME | jq -r .cars_limit)
[ "$PLAN" = "free" ] || fail "Ожидался plan=free, получили $PLAN"
[ "$LIMIT" = "3" ] || fail "Ожидался cars_limit=3, получили $LIMIT"
ok "План: $PLAN, лимит: $LIMIT"

step "3. Добавление автомобиля"
CAR=$(curl -s -X POST $API/cars \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "brand":"Kia","model":"K5","plate":"А001ЕЕ777","year":2024,
    "daily_price":3500,"location":"Москва","seats":5,
    "transmission":"Автомат","fuel":"Бензин"
  }')
CAR_ID=$(echo $CAR | jq -r .id)
[ "$CAR_ID" != "null" ] || fail "Не создалась машина: $CAR"
ok "Машина ID=$CAR_ID"

step "4. Публикация машины в витрине"
PATCH=$(curl -s -X PATCH $API/cars/$CAR_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"public_enabled":true,"status":"available"}')
ok "Опубликована"

step "5. Проверка публичного каталога"
PUB=$(curl -s "$API/public/cars")
COUNT=$(echo $PUB | jq 'length')
[ "$COUNT" -ge "1" ] || fail "Публичных машин: $COUNT"
ok "Машин в каталоге: $COUNT"

# ============ CUSTOMER ============
step "6. Регистрация клиента"
CUST=$(curl -s -X POST $API/auth/customer/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Пётр Клиент","phone":"+79990000002","password":"password123"}')
CUST_TOKEN=$(echo $CUST | jq -r .token)
[ "$CUST_TOKEN" != "null" ] || fail "Не получили токен клиента"
ok "Клиент зарегистрирован"

step "7. Проверка доступности дат"
FROM="2027-01-10"
TO="2027-01-15"
AVAIL=$(curl -s "$API/public/availability/dates?car_id=$CAR_ID&from=$FROM&to=$TO")
BLOCKED=$(echo $AVAIL | jq -r '.blocked | length')
[ "$BLOCKED" = "0" ] || fail "Ожидали 0 занятых дат, получили $BLOCKED"
ok "Даты свободны"

step "8. Бронирование клиентом"
BOOKING=$(curl -s -X POST $API/bookings \
  -H "Authorization: Bearer $CUST_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"car_id\": $CAR_ID,
    \"starts_at\": \"${FROM}T12:00:00Z\",
    \"ends_at\": \"${TO}T12:00:00Z\"
  }")
BOOKING_ID=$(echo $BOOKING | jq -r .id)
BOOKING_CODE=$(echo $BOOKING | jq -r .booking_code)
[ "$BOOKING_ID" != "null" ] || fail "Не создалась бронь: $BOOKING"
ok "Бронь $BOOKING_CODE (ID=$BOOKING_ID)"

step "9. Проверка занятости после брони"
AVAIL2=$(curl -s "$API/public/availability/dates?car_id=$CAR_ID&from=$FROM&to=$TO")
BLOCKED2=$(echo $AVAIL2 | jq -r '.blocked | length')
[ "$BLOCKED2" -gt "0" ] || fail "Даты не стали занятыми"
ok "Заблокировано дней: $BLOCKED2"

# ============ OWNER SEES BOOKING ============
step "10. Владелец видит бронь в /rentals"
RENTALS=$(curl -s $API/rentals -H "Authorization: Bearer $OWNER_TOKEN")
STATUS=$(echo $RENTALS | jq -r ".[] | select(.id == $BOOKING_ID) | .status")
[ "$STATUS" = "pending" ] || fail "Ожидали pending, получили $STATUS"
ok "Статус: $STATUS"

step "11. Владелец подтверждает"
curl -s -X PATCH $API/rentals/$BOOKING_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"confirmed"}' > /dev/null
STATUS=$(curl -s $API/rental-ops/$BOOKING_ID -H "Authorization: Bearer $OWNER_TOKEN" | jq -r .status)
[ "$STATUS" = "confirmed" ] || fail "Ожидали confirmed, получили $STATUS"
ok "Статус: $STATUS"

step "12. Владелец начинает подготовку"
curl -s -X PATCH $API/rentals/$BOOKING_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"preparing"}' > /dev/null
ok "Статус: preparing"

step "13. Владелец выдаёт авто"
curl -s -X PATCH $API/rentals/$BOOKING_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"active"}' > /dev/null
CAR_STATUS=$(curl -s $API/cars -H "Authorization: Bearer $OWNER_TOKEN" | jq -r ".[] | select(.id == $CAR_ID) | .status")
[ "$CAR_STATUS" = "rented" ] || fail "Машина не перешла в rented: $CAR_STATUS"
ok "Машина в аренде"

step "14. Владелец принимает возврат"
curl -s -X PATCH $API/rentals/$BOOKING_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"returned"}' > /dev/null
CAR_STATUS=$(curl -s $API/cars -H "Authorization: Bearer $OWNER_TOKEN" | jq -r ".[] | select(.id == $CAR_ID) | .status")
[ "$CAR_STATUS" = "available" ] || fail "Машина не вернулась в available: $CAR_STATUS"
ok "Машина свободна"

step "15. Владелец закрывает сделку"
curl -s -X PATCH $API/rentals/$BOOKING_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"completed"}' > /dev/null
CAR=$(curl -s $API/cars -H "Authorization: Bearer $OWNER_TOKEN" | jq ".[] | select(.id == $CAR_ID)")
REVENUE=$(echo $CAR | jq -r .revenue)
[ "$REVENUE" -gt "0" ] || fail "Revenue не начислилась: $REVENUE"
ok "Revenue: $REVENUE"

step "16. Клиент видит бронь в /customer/bookings"
CUST_BOOKINGS=$(curl -s $API/customer/bookings -H "Authorization: Bearer $CUST_TOKEN")
CUST_STATUS=$(echo $CUST_BOOKINGS | jq -r ".[] | select(.id == $BOOKING_ID) | .status")
[ "$CUST_STATUS" = "completed" ] || fail "Ожидали completed, получили $CUST_STATUS"
ok "Клиент видит: $CUST_STATUS"

step "17. Проверка dashboard владельца"
DASH=$(curl -s $API/dashboard -H "Authorization: Bearer $OWNER_TOKEN")
DASH_REV=$(echo $DASH | jq -r .revenue)
ok "Dashboard revenue: $DASH_REV"

step "18. Проверка лимита тарифа (402)"
# Создадим 3 машины, 4-я должна упасть с 402
for i in 2 3; do
  curl -s -X POST $API/cars \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"brand\":\"Lada\",\"model\":\"Vesta$i\",\"plate\":\"А00$i ЕЕ777\",\"year\":2024,\"daily_price\":2000}" > /dev/null
done
HTTP=$(curl -s -X POST $API/cars \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"brand":"Lada","model":"Granta","plate":"А004ЕЕ777","year":2024,"daily_price":2000}' \
  -o /tmp/car_resp.json -w "%{http_code}")
[ "$HTTP" = "402" ] || fail "Ожидали 402, получили $HTTP"
CODE=$(cat /tmp/car_resp.json | jq -r .code)
[ "$CODE" = "limit_reached" ] || fail "Ожидали code=limit_reached, получили $CODE"
ok "Лимит сработал: 402 limit_reached"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓✓✓ ВСЕ 18 ШАГОВ ПРОЙДЕНЫ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
