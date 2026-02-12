import { beforeEach, describe, expect, it } from "vitest";
import type {
  AgentRepository,
  DeploymentGateway,
  EncryptionService
} from "@/src/application/agent/contracts";
import { AgentService } from "@/src/application/agent/service";
import { AGENT_STATUS } from "@/src/domain/agent/types";

class FakeEncryption implements EncryptionService {
  encrypt(plainText: string): string {
    return `enc:${plainText}`;
  }

  decrypt(cipherText: string): string {
    return cipherText.replace("enc:", "");
  }
}

class FakeGateway implements DeploymentGateway {
  async deployAgent() {
    return { serviceId: "svc-123", logs: "ok" };
  }

  async restartAgent() {}
}

class InMemoryRepo implements AgentRepository {
  agents: any[] = [];
  secrets: any[] = [];
  deployments: any[] = [];

  async create(input: any) {
    const agent = {
      id: `${this.agents.length + 1}`,
      userId: input.userId,
      name: input.name,
      model: input.model,
      channel: input.channel,
      status: AGENT_STATUS.DRAFT,
      railwayServiceId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.push(agent);
    return agent;
  }

  async findById(agentId: string) {
    return this.agents.find((agent) => agent.id === agentId) ?? null;
  }

  async findByUser(userId: string) {
    return this.agents.filter((agent) => agent.userId === userId);
  }

  async updateStatus(agentId: string, status: any, railwayServiceId?: string | null) {
    const agent = await this.findById(agentId);
    if (!agent) throw new Error("Agent not found");
    agent.status = status;
    if (railwayServiceId !== undefined) {
      agent.railwayServiceId = railwayServiceId;
    }
    return agent;
  }

  async saveSecret(input: any) {
    this.secrets = this.secrets.filter((secret) => secret.agentId !== input.agentId);
    this.secrets.push({
      ...input,
      id: `${this.secrets.length + 1}`,
      createdAt: new Date()
    });
  }

  async getSecret(agentId: string) {
    return this.secrets.find((secret) => secret.agentId === agentId) ?? null;
  }

  async createDeployment(input: any) {
    const deployment = {
      ...input,
      id: `${this.deployments.length + 1}`,
      createdAt: new Date()
    };
    this.deployments.push(deployment);
    return deployment;
  }

  async getLatestDeployment(agentId: string) {
    const entries = this.deployments.filter((deployment) => deployment.agentId === agentId);
    return entries[entries.length - 1] ?? null;
  }
}

describe("AgentService", () => {
  let repo: InMemoryRepo;
  let service: AgentService;

  beforeEach(() => {
    repo = new InMemoryRepo();
    service = new AgentService(repo, new FakeGateway(), new FakeEncryption());
  });

  it("creates agent in DRAFT", async () => {
    const agent = await service.createAgent({
      userId: "u1",
      name: "bot",
      model: "gpt-4o",
      channel: "telegram"
    });

    expect(agent.status).toBe("DRAFT");
  });

  it("configures and deploys agent", async () => {
    const agent = await service.createAgent({
      userId: "u1",
      name: "bot",
      model: "gpt-4o",
      channel: "telegram"
    });

    const configured = await service.configureAgent({
      userId: "u1",
      agentId: agent.id,
      provider: "openai",
      apiKey: "sk-test",
      telegramBotToken: "bot-token",
      telegramChatId: "123"
    });

    expect(configured.status).toBe("CONFIGURED");

    const deployment = await service.deployAgent("u1", agent.id);
    expect(deployment.agent.status).toBe("RUNNING");
    expect(deployment.agent.railwayServiceId).toBe("svc-123");
  });
});
