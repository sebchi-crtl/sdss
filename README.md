# SDSS — Smart Decision Support System (Flood Early Warning)

**Stack**: Next.js 14 · TypeScript · Tailwind · shadcn-style UI · MapLibre GL · TanStack Query · Zustand · Recharts · Supabase (Auth/DB/Storage/Realtime)

This extended build adds:
- **Auth (Magic Link)** with Supabase + simple role profile
- **Sensors CRUD** UI + APIs
- **Realtime map** subscription to `sensor_readings` (Supabase Realtime)
- **Analytics page** with timeseries chart
- **Alert rules + evaluator** (`/api/cron/evaluate` + script)
- **Community reports** with photo upload to Supabase Storage
- **GIS overlay** via local GeoJSON

---

## 1) Setup

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
pnpm dev
```

Open http://localhost:3000 and login via magic link.

---

## 2) Database (Supabase/Postgres)

Run `db/schema.sql` in Supabase SQL editor.
Create public storage bucket `sdss` (public read).

### Initial roles
After first login, add your user to `profiles` with role 'admin':
```sql
insert into profiles(id, email, role)
select auth.uid(), (select email from auth.users where id = auth.uid()), 'admin'
on conflict (id) do update set role='admin';
```

---

## 3) Realtime & MQTT

- Realtime: enabled on `sensor_readings`. App subscribes and updates map markers.
- MQTT ingestion:
  - `pnpm mqtt:worker` (MQTT → `/api/ingest`)
  - `pnpm mqtt:sim` to simulate sensors

---

## 4) Alerts

- Define rules in `alert_rules`.
- Evaluate:
  - Local: `pnpm alerts:evaluate`
  - Deploy: schedule POST to `/api/cron/evaluate` (e.g., Vercel Cron, Supabase scheduler).

---

## 5) ML / Hydrological Model

- Run `ml_service_example.py` with FastAPI (optional) and set `MODEL_URL`.
- App proxies via `/api/predictions`.

---

## 6) Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Tighten RLS to your needs; policies here allow public reads for demo UX.
- Consider HMAC or device secrets for `/api/ingest` and rate limits.

---

NEXT_PUBLIC_SUPABASE_URL=https://tupayeyfeltsiomfpjsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cGF5ZXlmZWx0c2lvbWZwanN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjM0NTAsImV4cCI6MjA3MTA5OTQ1MH0.9MfeHzfXg7Yk0mjqGe21LA3cmCKtbVjBAKR6mU3V0Kw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cGF5ZXlmZWx0c2lvbWZwanN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUyMzQ1MCwiZXhwIjoyMDcxMDk5NDUwfQ.XcLRTD7lXYMtzEYTbbTxAkABk_TqP1GdH4Ki_X-vJZE

---

© 2025-08-17
