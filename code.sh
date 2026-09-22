cd /Users/artteam/Downloads/key-platform-v09-2-3-2

OUT=~/Desktop/key-context.txt
> "$OUT"

echo "===== TREE =====" >> "$OUT"
tree -I 'node_modules|.git|dist|build|.next|coverage|backup' -L 4 >> "$OUT"

echo -e "\n===== CONFIGS =====" >> "$OUT"
for f in Caddyfile README.md docker-compose.yml docker-compose.prod.yml client/nginx.conf client/package.json client/vite.config.ts client/tailwind.config.ts client/tsconfig.json server/go.mod; do
  if [ -f "$f" ]; then
    echo -e "\n--- $f ---" >> "$OUT"
    cat "$f" >> "$OUT"
  fi
done

echo -e "\n===== CLIENT SRC =====" >> "$OUT"
for f in \
  client/src/router.tsx \
  client/src/App.tsx \
  client/src/main.tsx \
  client/src/api/client.ts \
  client/src/api/index.ts \
  client/src/api/auth.ts \
  client/src/api/types.ts \
  client/src/pages/PricingPage.tsx \
  client/src/features/plans/plans.ts \
  client/src/stores/auth.ts \
  client/src/stores/ui.ts \
  client/src/lib/cn.ts \
  client/src/lib/format.ts \
  client/src/components/layout/index.ts
do
  if [ -f "$f" ]; then
    echo -e "\n--- $f ---" >> "$OUT"
    cat "$f" >> "$OUT"
  fi
done

echo -e "\n===== LEGAL PAGES =====" >> "$OUT"
find client/src/pages/legal -type f 2>/dev/null | while read -r f; do
  echo -e "\n--- $f ---" >> "$OUT"
  cat "$f" >> "$OUT"
done

echo -e "\n===== SERVER =====" >> "$OUT"
for f in \
  server/cmd/api/main.go \
  server/cmd/api/app.go \
  server/cmd/api/config.go \
  server/cmd/api/middleware.go \
  server/cmd/api/migrations.go \
  server/cmd/api/types.go \
  server/cmd/api/httpx.go \
  server/cmd/api/helpers.go
do
  if [ -f "$f" ]; then
    echo -e "\n--- $f ---" >> "$OUT"
    cat "$f" >> "$OUT"
  fi
done

echo -e "\n===== MIGRATIONS =====" >> "$OUT"
for f in server/migrations/*.sql; do
  echo -e "\n--- $f ---" >> "$OUT"
  cat "$f" >> "$OUT"
done

echo -e "\n===== DONE =====" >> "$OUT"
wc -l "$OUT"
echo "Файл: $OUT"