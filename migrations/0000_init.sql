CREATE TYPE agent_status AS ENUM ('DRAFT', 'CONFIGURED', 'DEPLOYING', 'RUNNING', 'FAILED', 'STOPPED');

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  model text NOT NULL,
  channel text NOT NULL DEFAULT 'telegram',
  status agent_status NOT NULL DEFAULT 'DRAFT',
  railway_service_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  provider text NOT NULL,
  encrypted_api_key text NOT NULL,
  telegram_bot_token text NOT NULL,
  telegram_chat_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status text NOT NULL,
  logs text,
  created_at timestamptz NOT NULL DEFAULT now()
);
