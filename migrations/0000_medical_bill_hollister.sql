CREATE TYPE "public"."agent_status" AS ENUM('DRAFT', 'CONFIGURED', 'DEPLOYING', 'RUNNING', 'FAILED', 'STOPPED');--> statement-breakpoint
CREATE TABLE "agent_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"telegram_bot_token" text NOT NULL,
	"telegram_chat_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"model" text NOT NULL,
	"channel" text DEFAULT 'telegram' NOT NULL,
	"status" "agent_status" DEFAULT 'DRAFT' NOT NULL,
	"railway_service_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" text NOT NULL,
	"logs" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_secrets" ADD CONSTRAINT "agent_secrets_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;