-- Create subscriptions table for recurring billing
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mp_preapproval_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  plan_id TEXT NOT NULL,
  max_agents INTEGER NOT NULL DEFAULT 1,
  next_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id ON subscriptions (mp_preapproval_id);
