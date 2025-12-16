CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner','client')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_user_id uuid REFERENCES users(id),
  plan text NOT NULL DEFAULT 'Pro',
  max_channels int NOT NULL DEFAULT 5,
  max_landing_pages int NOT NULL DEFAULT 20,
  max_tracking_profiles int NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAST_DUE','EXPIRED','PURGED')),
  subscription_end timestamptz,
  purge_after timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(client_id, user_id)
);

CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  UNIQUE(client_id, key)
);

CREATE TABLE IF NOT EXISTS tracking_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  pixel_id text NOT NULL,
  capi_token_enc text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  telegram_chat_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED')),
  bot_mode text NOT NULL DEFAULT 'universal' CHECK (bot_mode IN ('universal','dedicated')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tracking_profile_id uuid NOT NULL REFERENCES tracking_profiles(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  template_key text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused')),
  html_config jsonb,
  anti_crawler boolean NOT NULL DEFAULT false,
  deploy_provider text CHECK (deploy_provider IN ('netlify','github','manual')),
  deploy_url text,
  deploy_status text,
  last_deployed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  landing_page_id uuid REFERENCES landing_pages(id) ON DELETE SET NULL,
  tracking_profile_id uuid REFERENCES tracking_profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  session_id text,
  ip text,
  country text,
  user_agent text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  status text
);

CREATE INDEX IF NOT EXISTS idx_events_client_ts ON events(client_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_lp_ts ON events(landing_page_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_channel_ts ON events(channel_id, ts DESC);


CREATE TABLE IF NOT EXISTS joins (
  id bigserial PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  landing_page_id uuid REFERENCES landing_pages(id) ON DELETE SET NULL,
  tracking_profile_id uuid REFERENCES tracking_profiles(id) ON DELETE SET NULL,
  telegram_chat_id text,
  telegram_user_id text,
  invite_link text,
  invite_name text,
  ts timestamptz NOT NULL DEFAULT now(),
  capi_status text,
  capi_error text
);
CREATE INDEX IF NOT EXISTS idx_joins_client_ts ON joins(client_id, ts DESC);
