import { and, desc, eq } from "drizzle-orm";
import type {
  AgentRepository,
  CreateAgentInput
} from "@/src/application/agent/contracts";
import type { AgentStatus } from "@/src/domain/agent/types";
import { db } from "@/src/infrastructure/db/client";
import {
  agentSecretsTable,
  agentsTable,
  deploymentsTable
} from "@/src/infrastructure/db/schema";

export class DrizzleAgentRepository implements AgentRepository {
  async create(input: CreateAgentInput) {
    const [agent] = await db
      .insert(agentsTable)
      .values({
        userId: input.userId,
        name: input.name,
        model: input.model,
        channel: input.channel,
        status: "DRAFT"
      })
      .returning();

    return this.toAgent(agent);
  }

  async findById(agentId: string) {
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.id, agentId))
      .limit(1);

    return agent ? this.toAgent(agent) : null;
  }

  async findByUser(userId: string) {
    const agents = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.userId, userId))
      .orderBy(desc(agentsTable.createdAt));

    return agents.map((agent) => this.toAgent(agent));
  }

  async updateStatus(agentId: string, status: AgentStatus, railwayServiceId?: string | null) {
    const values: {
      status: AgentStatus;
      updatedAt: Date;
      railwayServiceId?: string | null;
    } = { status, updatedAt: new Date() };
    if (railwayServiceId !== undefined) {
      values.railwayServiceId = railwayServiceId;
    }

    const [agent] = await db
      .update(agentsTable)
      .set(values)
      .where(eq(agentsTable.id, agentId))
      .returning();

    return this.toAgent(agent);
  }

  async saveSecret(input: {
    agentId: string;
    provider: "openai" | "anthropic";
    encryptedApiKey: string;
    telegramBotToken: string;
    telegramChatId: string;
  }) {
    await db.delete(agentSecretsTable).where(eq(agentSecretsTable.agentId, input.agentId));

    await db.insert(agentSecretsTable).values({
      agentId: input.agentId,
      provider: input.provider,
      encryptedApiKey: input.encryptedApiKey,
      telegramBotToken: input.telegramBotToken,
      telegramChatId: input.telegramChatId
    });
  }

  async getSecret(agentId: string) {
    const [secret] = await db
      .select()
      .from(agentSecretsTable)
      .where(eq(agentSecretsTable.agentId, agentId))
      .orderBy(desc(agentSecretsTable.createdAt))
      .limit(1);

    if (!secret) return null;

    return {
      id: secret.id,
      agentId: secret.agentId,
      provider: secret.provider as "openai" | "anthropic",
      encryptedApiKey: secret.encryptedApiKey,
      telegramBotToken: secret.telegramBotToken,
      telegramChatId: secret.telegramChatId,
      createdAt: secret.createdAt
    };
  }

  async createDeployment(input: {
    agentId: string;
    status: "started" | "success" | "failed";
    logs: string | null;
  }) {
    const [deployment] = await db.insert(deploymentsTable).values(input).returning();
    return {
      id: deployment.id,
      agentId: deployment.agentId,
      status: deployment.status as "started" | "success" | "failed",
      logs: deployment.logs,
      createdAt: deployment.createdAt
    };
  }

  async getLatestDeployment(agentId: string) {
    const [deployment] = await db
      .select()
      .from(deploymentsTable)
      .where(and(eq(deploymentsTable.agentId, agentId)))
      .orderBy(desc(deploymentsTable.createdAt))
      .limit(1);

    if (!deployment) return null;
    return {
      id: deployment.id,
      agentId: deployment.agentId,
      status: deployment.status as "started" | "success" | "failed",
      logs: deployment.logs,
      createdAt: deployment.createdAt
    };
  }

  private toAgent(agent: typeof agentsTable.$inferSelect) {
    return {
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      model: agent.model,
      channel: agent.channel as "telegram",
      status: agent.status,
      railwayServiceId: agent.railwayServiceId,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt
    };
  }
}
