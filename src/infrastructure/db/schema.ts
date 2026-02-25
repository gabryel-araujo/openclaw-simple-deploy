import { sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const agentStatusEnum = pgEnum("agent_status", [
  "DRAFT",
  "CONFIGURED",
  "DEPLOYING",
  "RUNNING",
  "FAILED",
  "STOPPED",
]);

export const agentsTable = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  channel: text("channel").notNull().default("telegram"),
  status: agentStatusEnum("status").notNull().default("DRAFT"),
  railwayServiceId: text("railway_service_id"),
  railwayDomain: text("railway_domain"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const agentSecretsTable = pgTable("agent_secrets", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  telegramBotToken: text("telegram_bot_token").notNull(),
  telegramChatId: text("telegram_chat_id"),
  telegramUserId: text("telegram_user_id"),
  setupPassword: text("setup_password"),
  gatewayToken: text("gateway_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deploymentsTable = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  logs: text("logs"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  transactionId: text("transaction_id").notNull(),
  status: text("status").notNull(),
  amount: text("amount").notNull(),
  planId: text("plan_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  mpPreapprovalId: text("mp_preapproval_id").notNull(),
  status: text("status").notNull().default("pending"),
  planId: text("plan_id").notNull(),
  maxAgents: integer("max_agents").notNull().default(1),
  nextPaymentDate: timestamp("next_payment_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
