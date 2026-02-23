ALTER TABLE "agents" ADD COLUMN "railway_domain" text;

ALTER TABLE "agent_secrets" ADD COLUMN "setup_password" text;
ALTER TABLE "agent_secrets" ADD COLUMN "gateway_token" text;

