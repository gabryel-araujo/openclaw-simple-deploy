-- =====================================================
-- Restore/Enable RLS on ALL tables
-- =====================================================
-- This migration ensures RLS is on for every table and
-- that users can only access their own data.
-- Policies use CREATE ... IF NOT EXISTS-style by first
-- dropping (if exists) then recreating, to be idempotent.
-- =====================================================

-- ─── profiles ───────────────────────────────────────
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── agents ─────────────────────────────────────────
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agents" ON agents;
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agents" ON agents;
CREATE POLICY "Users can insert own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agents" ON agents;
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agents" ON agents;
CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- ─── agent_secrets ──────────────────────────────────
ALTER TABLE agent_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent secrets" ON agent_secrets;
CREATE POLICY "Users can view own agent secrets"
  ON agent_secrets FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own agent secrets" ON agent_secrets;
CREATE POLICY "Users can insert own agent secrets"
  ON agent_secrets FOR INSERT
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own agent secrets" ON agent_secrets;
CREATE POLICY "Users can update own agent secrets"
  ON agent_secrets FOR UPDATE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  )
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own agent secrets" ON agent_secrets;
CREATE POLICY "Users can delete own agent secrets"
  ON agent_secrets FOR DELETE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- ─── deployments ────────────────────────────────────
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deployments" ON deployments;
CREATE POLICY "Users can view own deployments"
  ON deployments FOR SELECT
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own deployments" ON deployments;
CREATE POLICY "Users can insert own deployments"
  ON deployments FOR INSERT
  WITH CHECK (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own deployments" ON deployments;
CREATE POLICY "Users can update own deployments"
  ON deployments FOR UPDATE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own deployments" ON deployments;
CREATE POLICY "Users can delete own deployments"
  ON deployments FOR DELETE
  USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- ─── payments ───────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── subscriptions ──────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Service role bypass
-- =====================================================
-- The application connects with the service_role key via
-- DATABASE_URL (direct connection), which bypasses RLS.
-- The anon key (used by Supabase client on the browser)
-- is subject to these policies.
-- =====================================================
