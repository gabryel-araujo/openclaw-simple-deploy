import { AGENT_STATUS } from "@/src/domain/agent/types";
import type {
  AgentRepository,
  ConfigAgentInput,
  CreateAgentInput,
  DeploymentGateway,
  EncryptionService,
} from "./contracts";
import type { SubscriptionRepository } from "@/src/infrastructure/repositories/subscription-repository";
import crypto from "node:crypto";

const PROVIDER_MODEL_PREFIXES = {
  openai: ["gpt-", "o1-", "o3-"],
  anthropic: ["claude-"],
  google: ["gemini-"],
  venice: ["llama-", "claude-"],
} as const;

function toOpenClawModelRef(provider: string, model: string) {
  const normalized = model.trim().toLowerCase();
  if (!normalized) return normalized;
  if (normalized.includes("/")) return normalized;
  return `${provider}/${normalized}`;
}

export class AgentService {
  constructor(
    private readonly repository: AgentRepository,
    private readonly deploymentGateway: DeploymentGateway,
    private readonly encryptionService: EncryptionService,
    private readonly subscriptionRepository?: SubscriptionRepository,
  ) {}

  async createAgent(input: CreateAgentInput) {
    // Enforce subscription-based deploy limit
    if (this.subscriptionRepository) {
      const subscription = await this.subscriptionRepository.findByUser(
        input.userId,
      );
      if (!subscription || subscription.status !== "authorized") {
        throw new Error(
          "Assinatura inativa. Assine o plano para fazer deploy de agentes.",
        );
      }

      const existingAgents = await this.repository.findByUser(input.userId);
      if (existingAgents.length >= subscription.maxAgents) {
        throw new Error(
          `Limite de agentes atingido (${subscription.maxAgents}). Exclua um agente existente e tente novamente.`,
        );
      }
    }

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
    if (
      agent.status !== AGENT_STATUS.DRAFT &&
      agent.status !== AGENT_STATUS.CONFIGURED &&
      agent.status !== AGENT_STATUS.RUNNING &&
      agent.status !== AGENT_STATUS.STOPPED &&
      agent.status !== AGENT_STATUS.FAILED
    ) {
      throw new Error("Agent is not configurable in the current status");
    }

    this.assertProviderSupportsModel(input.provider, agent.model);

    const existingSecret = await this.repository.getSecret(input.agentId);

    await this.repository.saveSecret({
      agentId: input.agentId,
      provider: input.provider,
      encryptedApiKey: this.encryptionService.encrypt(input.apiKey),
      telegramBotToken: this.encryptionService.encrypt(input.telegramBotToken),
      telegramUserId: this.encryptionService.encrypt(input.telegramUserId),
      telegramChatId: input.telegramChatId
        ? this.encryptionService.encrypt(input.telegramChatId)
        : null,
      // Preserve runtime secrets so we can re-run /finalize on an already-deployed agent.
      setupPassword: existingSecret?.setupPassword ?? null,
      gatewayToken: existingSecret?.gatewayToken ?? null,
    });

    // Only force CONFIGURED when the agent isn't already deployed/running.
    if (
      agent.status === AGENT_STATUS.DRAFT ||
      agent.status === AGENT_STATUS.CONFIGURED
    ) {
      return this.repository.updateStatus(
        input.agentId,
        AGENT_STATUS.CONFIGURED,
      );
    }

    return agent;
  }

  async deployAgent(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);
    if (
      agent.status !== AGENT_STATUS.CONFIGURED &&
      agent.status !== AGENT_STATUS.STOPPED
    ) {
      throw new Error("Agent must be configured before deploy");
    }

    const secret = await this.repository.getSecret(agentId);
    if (!secret) {
      throw new Error("Agent secrets were not configured");
    }
    if (!secret.telegramUserId) {
      throw new Error(
        "Telegram user id not configured. Send /start to the bot and re-run configuration.",
      );
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
      logs: "Deploy started",
    });

    try {
      this.assertProviderSupportsModel(secret.provider, agent.model);

      const deployResult = await this.deploymentGateway.deployAgent({
        agentId,
        model: toOpenClawModelRef(secret.provider, agent.model),
        provider: secret.provider,
        providerApiKey: this.encryptionService.decrypt(secret.encryptedApiKey),
        telegramBotToken: this.encryptionService.decrypt(
          secret.telegramBotToken,
        ),
        telegramUserId: this.encryptionService.decrypt(secret.telegramUserId),
        telegramChatId: secret.telegramChatId
          ? this.encryptionService.decrypt(secret.telegramChatId)
          : null,
        setupPassword: setupPasswordPlain,
        gatewayToken: gatewayTokenPlain,
      });

      await this.repository.createDeployment({
        agentId,
        status: "success",
        logs: deployResult.logs,
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
        logs: String(error),
      });

      const failedAgent = await this.repository.updateStatus(
        agentId,
        AGENT_STATUS.FAILED,
      );
      return { agent: failedAgent };
    }
  }

  async finalizeSetup(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);
    if (
      agent.status !== AGENT_STATUS.DEPLOYING &&
      agent.status !== AGENT_STATUS.RUNNING
    ) {
      throw new Error("Agent is not in a deployable state");
    }
    if (!agent.railwayServiceId) {
      throw new Error("Agent runtime service id not available yet");
    }

    const secret = await this.repository.getSecret(agentId);
    if (!secret?.setupPassword) {
      throw new Error("Setup password not found for agent");
    }
    if (!secret.telegramUserId) {
      throw new Error(
        "Telegram user id not configured. Reconfigure the agent after sending /start to the bot.",
      );
    }

    this.assertProviderSupportsModel(secret.provider, agent.model);

    const setupResult = await this.deploymentGateway.finalizeSetup({
      serviceId: agent.railwayServiceId,
      railwayDomain: agent.railwayDomain,
      setupPassword: this.encryptionService.decrypt(secret.setupPassword),
      provider: secret.provider,
      providerApiKey: this.encryptionService.decrypt(secret.encryptedApiKey),
      model: toOpenClawModelRef(secret.provider, agent.model),
      telegramBotToken: this.encryptionService.decrypt(secret.telegramBotToken),
      telegramUserId: this.encryptionService.decrypt(secret.telegramUserId),
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
    return this.repository.updateStatus(
      agentId,
      AGENT_STATUS.RUNNING,
      agent.railwayServiceId,
    );
  }

  async getGatewayToken(userId: string, agentId: string) {
    await this.getAgent(userId, agentId);
    const secret = await this.repository.getSecret(agentId);
    if (!secret?.gatewayToken) {
      throw new Error("Gateway token not available for this agent yet");
    }
    return this.encryptionService.decrypt(secret.gatewayToken);
  }

  async getSetupPassword(userId: string, agentId: string) {
    await this.getAgent(userId, agentId);
    const secret = await this.repository.getSecret(agentId);
    if (!secret?.setupPassword) {
      throw new Error("Setup password not available for this agent yet");
    }
    return this.encryptionService.decrypt(secret.setupPassword);
  }

  async stopAllAgents(userId: string) {
    const agents = await this.repository.findByUser(userId);
    const running = agents.filter(
      (a) =>
        a.status === AGENT_STATUS.RUNNING ||
        a.status === AGENT_STATUS.DEPLOYING,
    );

    for (const agent of running) {
      try {
        await this.repository.updateStatus(agent.id, AGENT_STATUS.STOPPED);
      } catch {
        // best-effort — continue stopping others
      }
    }
  }

  async deleteAgent(userId: string, agentId: string) {
    const agent = await this.getAgent(userId, agentId);

    // Delete Railway service if it was deployed
    if (agent.railwayServiceId) {
      await this.deploymentGateway.deleteService(agent.railwayServiceId);
    }

    // Cascade delete all DB records (deployments → secrets → agent)
    await this.repository.delete(agentId);
  }

  private assertProviderSupportsModel(provider: string, model: string) {
    const normalizedModel = model.trim().toLowerCase();
    if (!normalizedModel) {
      throw new Error("Model is required");
    }

    const parts = normalizedModel.split("/");
    const providerInRef = parts.length >= 2 ? parts[0] : null;
    const modelId =
      parts.length >= 2 ? parts.slice(1).join("/") : normalizedModel;

    if (providerInRef && providerInRef !== provider) {
      throw new Error(
        `Model "${model}" is not compatible with provider "${provider}" (got ${providerInRef}).`,
      );
    }
    const allowedPrefixes =
      PROVIDER_MODEL_PREFIXES[provider as keyof typeof PROVIDER_MODEL_PREFIXES];
    if (!allowedPrefixes) {
      throw new Error(`Provider "${provider}" is not supported.`);
    }
    const isSupported = allowedPrefixes.some((prefix) =>
      modelId.startsWith(prefix),
    );

    if (isSupported) return;

    const expectedFamily =
      provider === "openai"
        ? "gpt-*"
        : provider === "anthropic"
          ? "claude-*"
          : provider === "google"
            ? "gemini-*"
            : "llama-* ou claude-*";
    throw new Error(
      `Model "${model}" is not compatible with provider "${provider}" (expected ${expectedFamily}).`,
    );
  }
}
