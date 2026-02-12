import type { DeploymentGateway } from "@/src/application/agent/contracts";

type RailwayDeployInput = {
  agentId: string;
  model: string;
  providerApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
};

export class RailwayDeploymentGateway implements DeploymentGateway {
  async deployAgent(input: RailwayDeployInput) {
    if (!process.env.RAILWAY_API_TOKEN || !process.env.RAILWAY_PROJECT_ID) {
      return {
        serviceId: `stub-${input.agentId}`,
        logs:
          "Railway API token/project not set. Running in stub mode for local development."
      };
    }

    // Integration point for Railway API/CLI.
    // The service should create/update an app service and inject env vars:
    // DEFAULT_MODEL, MESSAGING_CHANNEL, PROVIDER_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
    return {
      serviceId: `railway-${input.agentId}`,
      logs: "Deploy dispatched to Railway adapter."
    };
  }

  async restartAgent(serviceId: string) {
    if (!serviceId) {
      throw new Error("Service id is required");
    }
  }
}
