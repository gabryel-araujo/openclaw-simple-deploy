import type { DeploymentGateway } from "@/src/application/agent/contracts";

type RailwayDeployInput = {
  agentId: string;
  model: string;
  providerApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
};

export class RailwayDeploymentGateway implements DeploymentGateway {
  private readonly apiUrl = "https://backboard.railway.app/graphql/v2";

  async deployAgent(input: RailwayDeployInput) {
    const apiToken = process.env.RAILWAY_API_TOKEN;
    const projectId = process.env.RAILWAY_PROJECT_ID;
    const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    const dockerImage =
      process.env.OPENCLAW_DOCKER_IMAGE ||
      "ghcr.io/gabryelaraujo/openclaw:latest";

    if (!apiToken || !projectId || !environmentId) {
      console.warn("Railway configuration is missing. Running in stub mode.");
      return {
        serviceId: `stub-${input.agentId}`,
        logs: "Railway API token/project/environment not set. Stub mode.",
      };
    }

    try {
      // 1. Create a new Service for this Agent
      const serviceCreateQuery = `
        mutation serviceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
          }
        }
      `;

      const serviceRes = await this.graphqlRequest(
        apiToken,
        serviceCreateQuery,
        {
          input: {
            projectId,
            name: `OpenClaw - Agent ${input.agentId.split("-")[0]}`,
          },
        },
      );
      const serviceId = serviceRes.data.serviceCreate.id;

      // 2. Set the Docker Image as the Source
      const updateSourceQuery = `
        mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
          serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
        }
      `;

      await this.graphqlRequest(apiToken, updateSourceQuery, {
        serviceId,
        environmentId,
        input: {
          source: {
            image: dockerImage,
          },
        },
      });

      // 3. Inject Environment Variables (Triggers the first deploy automatically)
      const upsertVarsQuery = `
        mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
      `;

      const variables = {
        DEFAULT_MODEL: input.model,
        MESSAGING_CHANNEL: "telegram",
        PROVIDER_API_KEY: input.providerApiKey,
        TELEGRAM_BOT_TOKEN: input.telegramBotToken,
        TELEGRAM_CHAT_ID: input.telegramChatId,
      };

      await this.graphqlRequest(apiToken, upsertVarsQuery, {
        input: {
          projectId,
          environmentId,
          serviceId,
          variables,
        },
      });

      return {
        serviceId,
        logs: "Deploy successfully dispatched to Railway via GraphQL.",
      };
    } catch (error) {
      console.error("[Railway] Deploy Error:", error);
      throw new Error(
        `Railway deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async restartAgent(serviceId: string) {
    if (!serviceId) {
      throw new Error("Service ID is required to restart");
    }

    const apiToken = process.env.RAILWAY_API_TOKEN;
    const projectId = process.env.RAILWAY_PROJECT_ID;
    const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

    if (
      !apiToken ||
      !projectId ||
      !environmentId ||
      serviceId.startsWith("stub-")
    ) {
      return; // Run in stub mode
    }

    // A simple hack to force a redeploy in Railway is updating an environment variable
    const upsertVarsQuery = `
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `;

    await this.graphqlRequest(apiToken, upsertVarsQuery, {
      input: {
        projectId,
        environmentId,
        serviceId,
        variables: {
          RESTART_TRIGGER: Date.now().toString(),
        },
      },
    });
  }

  private async graphqlRequest(token: string, query: string, variables: any) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const body = await response.json();
    if (body.errors && body.errors.length > 0) {
      throw new Error(body.errors[0].message);
    }
    return body;
  }
}
