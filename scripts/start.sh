#!/usr/bin/env bash
#
# Start-skript för Railway (och andra deploys).
#
# 1. Kör databasmigrationer.
# 2. Seedar demo-data i ALLA miljöer UTOM produktion – så att PR-/dev-miljöer
#    blir direkt inloggningsbara. RAILWAY_ENVIRONMENT_NAME sätts automatiskt av
#    Railway per miljö ("production" i prod, PR-namnet i PR-miljöer) och ärvs
#    INTE som en vanlig variabel, så produktion seedas aldrig av misstag.
# 3. Startar Next.js.
#
set -euo pipefail

./node_modules/.bin/prisma migrate deploy

ENV_NAME="${RAILWAY_ENVIRONMENT_NAME:-local}"
if [ "$ENV_NAME" != "production" ]; then
  echo "→ Seedar demo-data (miljö: $ENV_NAME)…"
  npm run db:seed || echo "⚠ Seed misslyckades – startar ändå."
else
  echo "→ Produktion: hoppar över seed."
fi

exec ./node_modules/.bin/next start
