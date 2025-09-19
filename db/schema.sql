-- Extensions
create extension if not exists postgis;
create extension if not exists timescaledb;

-- Users
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'viewer' check (role in ('admin','operator','viewer')),
  created_at timestamptz default now()
);

-- Sensors
create table if not exists sensors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('RAIN','RIVER','WATER_LEVEL','WIND','TEMP','HUMIDITY')),
  lat double precision not null,
  lon double precision not null,
  elevation double precision,
  installed_at timestamptz default now()
);

-- Readings
create table if not exists sensor_readings (
  id bigserial primary key,
  sensor_id uuid references sensors(id) on delete cascade,
  ts timestamptz not null,
  value double precision not null,
  status text check (status in ('OK','WARN','CRIT')),
  raw jsonb,
  lat double precision,
  lon double precision
);
select create_hypertable('sensor_readings','ts', if_not_exists => true);
create index if not exists idx_sr_sensor_ts on sensor_readings(sensor_id, ts desc);

-- Alerts
create table if not exists alerts (
  id bigserial primary key,
  type text not null check (type in ('FLOOD','RAIN','RIVER_RISE','SYSTEM')),
  level text not null check (level in ('INFO','WATCH','WARNING','EMERGENCY')),
  message text not null,
  created_at timestamptz default now(),
  area geometry
);

-- Alert rules
create table if not exists alert_rules (
  id bigserial primary key,
  name text not null,
  alert_type text not null default 'SYSTEM' check (alert_type in ('FLOOD','RAIN','RIVER_RISE','SYSTEM')),
  level text not null default 'INFO' check (level in ('INFO','WATCH','WARNING','EMERGENCY')),
  threshold double precision not null default 50,
  status text default 'OK' check (status in ('OK','WARN','CRIT')),
  message text
);

-- Predictions
create table if not exists predictions (
  id bigserial primary key,
  horizon_hours integer[] not null,
  risk_scores double precision[] not null,
  confidence_scores double precision[] not null,
  factors jsonb,
  recommendations text[],
  created_at timestamptz default now()
);
select create_hypertable('predictions','created_at', if_not_exists => true);

-- Community reports
create table if not exists reports (
  id bigserial primary key,
  description text not null,
  lat double precision not null,
  lon double precision not null,
  photo_url text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table sensors enable row level security;
alter table sensor_readings enable row level security;
alter table alerts enable row level security;
alter table reports enable row level security;
alter table alert_rules enable row level security;
alter table predictions enable row level security;

-- Policies: Public read for map/analytics; writes restricted to service role or admins.
create policy "read profiles self" on profiles for select using (auth.uid() = id);
create policy "insert profile self" on profiles for insert with check (auth.uid() = id);

create policy "public read sensors" on sensors for select using (true);
create policy "admin write sensors" on sensors for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','operator')));

create policy "public read readings" on sensor_readings for select using (true);
create policy "service insert readings" on sensor_readings for insert with check (true); -- use service key via API

create policy "public read alerts" on alerts for select using (true);
create policy "admin write alerts" on alerts for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','operator')));

create policy "public read reports" on reports for select using (true);
create policy "anyone create reports" on reports for insert with check (true);

create policy "public read alert_rules" on alert_rules for select using (true);
create policy "admin write alert_rules" on alert_rules for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin')));

create policy "public read predictions" on predictions for select using (true);
create policy "service insert predictions" on predictions for insert with check (true); -- use service key via API
