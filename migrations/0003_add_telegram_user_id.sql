ALTER TABLE "agent_secrets" ADD COLUMN "telegram_user_id" text;

-- The new 1-click flow uses allowlist (Telegram user id). Chat id is optional.
ALTER TABLE "agent_secrets" ALTER COLUMN "telegram_chat_id" DROP NOT NULL;

