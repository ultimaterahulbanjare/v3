# UTS Backend (Postgres) — Render ready

This backend matches the **UTS UI v3** routes:
- Separate client & owner logins
- Channels / Landing Pages / Tracking Profiles
- Logs (events)
- Export LP as HTML ZIP (Deploy panel)

## Local run
```bash
cp .env.example .env
# set DATABASE_URL to your local postgres
npm install
npm run migrate
npm start
```

## Render deploy (GitHub or Direct)
1. Create a **PostgreSQL** database on Render.
2. Create a **Web Service** from this repo.
3. Environment variables:
   - DATABASE_URL (from Render Postgres)
   - JWT_SECRET
   - CORS_ORIGIN (your UI domain; for dev: http://localhost:5173)
   - SEED_ON_MIGRATE=true (optional first run)
4. Build Command:
   - `npm install`
5. Start Command:
   - `npm start`

### First run / migrations
On server boot, migrations run automatically. If `SEED_ON_MIGRATE=true`, it will create demo users + demo client + demo records.

## API quick test
- POST /auth/login  { "email":"demo@client.com", "password":"demo123" }
- POST /auth/owner/login { "email":"owner@admin.com", "password":"admin123" }
- Use returned `access_token` as:
  - Authorization: Bearer <token>

## Notes
- CAPI tokens are stored as `capi_token_enc` (you can add AES-GCM later).
- Export ZIP endpoint: GET /deploy/export/:lp_id


## Telegram webhook setup
1. Set env:
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_AUTO_APPROVE=true (optional)
   - TELEGRAM_WEBHOOK_SECRET (optional)
2. Set webhook (run once in browser or curl):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<YOUR-RENDER-DOMAIN>/telegram/webhook","secret_token":"<YOUR_SECRET>"}'
```

### LP attribution tip
To attribute joins to a specific LP:
- Set your Telegram invite link **name** equal to the LP **slug**.
Then join events will be mapped to that LP automatically.
