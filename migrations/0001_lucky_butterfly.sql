CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" text NOT NULL,
	"status" text NOT NULL,
	"amount" text NOT NULL,
	"plan_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
