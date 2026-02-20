import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  telegramChatId: text("telegram_chat_id").notNull(),
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
