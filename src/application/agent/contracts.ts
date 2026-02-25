import type {
  Agent,
  AgentSecret,
  Deployment,
  Provider,
} from "@/src/domain/agent/types";

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
  telegramUserId: string;
  telegramChatId?: string | null;
};

export interface AgentRepository {
  create(input: CreateAgentInput): Promise<Agent>;
  findById(agentId: string): Promise<Agent | null>;
  findByUser(userId: string): Promise<Agent[]>;
  updateStatus(
    agentId: string,
    status: Agent["status"],
    railwayServiceId?: string | null,
    railwayDomain?: string | null,
  ): Promise<Agent>;
  saveSecret(input: Omit<AgentSecret, "id" | "createdAt">): Promise<void>;
  getSecret(agentId: string): Promise<AgentSecret | null>;
  updateRuntimeSecrets(input: {
    agentId: string;
    setupPassword: string;
    gatewayToken: string;
  }): Promise<void>;
  createDeployment(
    input: Omit<Deployment, "id" | "createdAt">,
  ): Promise<Deployment>;
  getLatestDeployment(agentId: string): Promise<Deployment | null>;
  delete(agentId: string): Promise<void>;
}

export interface DeploymentGateway {
  deployAgent(input: {
    agentId: string;
    model: string;
    provider: Provider;
    providerApiKey: string;
    telegramBotToken: string;
    telegramUserId: string;
    telegramChatId?: string | null;
    setupPassword: string;
    gatewayToken: string;
  }): Promise<{
    serviceId: string;
    logs: string;
    railwayDomain: string | null;
  }>;
  finalizeSetup(input: {
    serviceId: string;
    railwayDomain: string | null;
    setupPassword: string;
    provider: Provider;
    providerApiKey: string;
    model?: string;
    telegramBotToken: string;
    telegramUserId: string;
  }): Promise<{ logs: string; railwayDomain: string }>;
  restartAgent(serviceId: string): Promise<void>;
  deleteService(serviceId: string): Promise<void>;
}

export interface EncryptionService {
  encrypt(plainText: string): string;
  decrypt(cipherText: string): string;
}
