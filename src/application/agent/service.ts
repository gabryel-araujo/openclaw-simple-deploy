import { AGENT_STATUS } from "@/src/domain/agent/types";
import type {
  AgentRepository,
  ConfigAgentInput,
  CreateAgentInput,
  DeploymentGateway,
  EncryptionService
} from "./contracts";
import crypto from "node:crypto";

export class AgentService {
  constructor(
    private readonly repository: AgentRepository,
    private readonly deploymentGateway: DeploymentGateway,
    private readonly encryptionService: EncryptionService
  ) {}

  async createAgent(input: CreateAgentInput) {
    return this.repository.create(input);
  }

  async listByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  async getAgent(userId: string, agentId: string) {
    const agent = await this.repository.findById(agentId);
    if (!agent || agent.userId !== userId) {
      throw new Error("Agent not found");
    }

    return agent;
  }

  async configureAgent(input: ConfigAgentInput) {
    const agent = await this.getAgent(input.userId, input.agentId);
    if (agent.status !== AGENT_STATUS.DRAFT && agent.status !== AGENT_STATUS.CONFIGURED) {
      throw new Error("Agent is not configurable in the current status");
    }

    await this.repository.saveSecret({
      agentId: input.agentId,
      provider: input.provider,
      encryptedApiKey: this.encryptionService.encrypt(input.apiKey),
      telegramBotToken: this.encryptionService.encrypt(input.telegramBotToken),
      telegramChatId: this.encryptionService.encrypt(input.telegramChatId),
      setupPassword: null,
      gatewayToken: null,
    });

    return this.repository.updateStatus(input.agentId, AGENT_STATUS.CONFIGURED);
  }

  async deployAgent(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);
    if (agent.status !== AGENT_STATUS.CONFIGURED && agent.status !== AGENT_STATUS.STOPPED) {
      throw new Error("Agent must be configured before deploy");
    }

    const secret = await this.repository.getSecret(agentId);
    if (!secret) {
      throw new Error("Agent secrets were not configured");
    }

    const setupPasswordPlain = crypto.randomBytes(24).toString("base64url");
    const gatewayTokenPlain = crypto.randomBytes(32).toString("hex");
    await this.repository.updateRuntimeSecrets({
      agentId,
      setupPassword: this.encryptionService.encrypt(setupPasswordPlain),
      gatewayToken: this.encryptionService.encrypt(gatewayTokenPlain),
    });

    await this.repository.updateStatus(agentId, AGENT_STATUS.DEPLOYING);
    await this.repository.createDeployment({
      agentId,
      status: "started",
      logs: "Deploy started"
    });

    try {
      const deployResult = await this.deploymentGateway.deployAgent({
        agentId,
        model: agent.model,
        provider: secret.provider,
        providerApiKey: this.encryptionService.decrypt(secret.encryptedApiKey),
        telegramBotToken: this.encryptionService.decrypt(secret.telegramBotToken),
        telegramChatId: this.encryptionService.decrypt(secret.telegramChatId),
        setupPassword: setupPasswordPlain,
        gatewayToken: gatewayTokenPlain,
      });

      await this.repository.createDeployment({
        agentId,
        status: "success",
        logs: deployResult.logs
      });

      const updatedAgent = await this.repository.updateStatus(
        agentId,
        AGENT_STATUS.DEPLOYING,
        deployResult.serviceId,
        deployResult.railwayDomain ?? null,
      );

      return { agent: updatedAgent };
    } catch (error) {
      await this.repository.createDeployment({
        agentId,
        status: "failed",
        logs: String(error)
      });

      const failedAgent = await this.repository.updateStatus(agentId, AGENT_STATUS.FAILED);
      return { agent: failedAgent };
    }
  }

  async finalizeSetup(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);
    if (agent.status !== AGENT_STATUS.DEPLOYING) {
      throw new Error("Agent is not in a deployable state");
    }
    if (!agent.railwayServiceId) {
      throw new Error("Agent runtime service id not available yet");
    }

    const secret = await this.repository.getSecret(agentId);
    if (!secret?.setupPassword) {
      throw new Error("Setup password not found for agent");
    }

    const setupResult = await this.deploymentGateway.finalizeSetup({
      serviceId: agent.railwayServiceId,
      railwayDomain: agent.railwayDomain,
      setupPassword: this.encryptionService.decrypt(secret.setupPassword),
      provider: secret.provider,
      providerApiKey: this.encryptionService.decrypt(secret.encryptedApiKey),
      model: agent.model.includes("/") ? agent.model : undefined,
      telegramBotToken: this.encryptionService.decrypt(secret.telegramBotToken),
    });

    await this.repository.createDeployment({
      agentId,
      status: "success",
      logs: setupResult.logs,
    });

    return this.repository.updateStatus(
      agentId,
      AGENT_STATUS.RUNNING,
      agent.railwayServiceId,
      setupResult.railwayDomain,
    );
  }

  async getLogs(userId: string, agentId: string) {
    await this.getAgent(userId, agentId);
    const deployment = await this.repository.getLatestDeployment(agentId);
    return deployment?.logs ?? "No logs available";
  }

  async restartAgent(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);
    if (!agent.railwayServiceId) {
      throw new Error("Agent is not deployed yet");
    }

    await this.deploymentGateway.restartAgent(agent.railwayServiceId);
    return this.repository.updateStatus(agentId, AGENT_STATUS.RUNNING, agent.railwayServiceId);
  }
}
