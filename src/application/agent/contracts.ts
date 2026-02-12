import type { Agent, AgentSecret, Deployment, Provider } from "@/src/domain/agent/types";

export type CreateAgentInput = {
  userId: string;
  name: string;
  model: string;
  channel: "telegram";
};

export type ConfigAgentInput = {
  userId: string;
  agentId: string;
  provider: Provider;
  apiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
};

export interface AgentRepository {
  create(input: CreateAgentInput): Promise<Agent>;
  findById(agentId: string): Promise<Agent | null>;
  findByUser(userId: string): Promise<Agent[]>;
  updateStatus(
    agentId: string,
    status: Agent["status"],
    railwayServiceId?: string | null
  ): Promise<Agent>;
  saveSecret(input: Omit<AgentSecret, "id" | "createdAt">): Promise<void>;
  getSecret(agentId: string): Promise<AgentSecret | null>;
  createDeployment(input: Omit<Deployment, "id" | "createdAt">): Promise<Deployment>;
  getLatestDeployment(agentId: string): Promise<Deployment | null>;
}

export interface DeploymentGateway {
  deployAgent(input: {
    agentId: string;
    model: string;
    providerApiKey: string;
    telegramBotToken: string;
    telegramChatId: string;
  }): Promise<{ serviceId: string; logs: string }>;
  restartAgent(serviceId: string): Promise<void>;
}

export interface EncryptionService {
  encrypt(plainText: string): string;
  decrypt(cipherText: string): string;
}
