import type { DeploymentGateway } from "@/src/application/agent/contracts";

type RailwayDeployInput = {
  agentId: string;
  model: string;
  provider: "openai" | "anthropic";
  providerApiKey: string;
  telegramBotToken: string;
  telegramUserId: string;
  telegramChatId?: string | null;
  setupPassword: string;
  gatewayToken: string;
};

export class RailwayDeploymentGateway implements DeploymentGateway {
  private readonly apiUrl = "https://backboard.railway.app/graphql/v2";

  async deployAgent(input: RailwayDeployInput) {
    const apiToken = process.env.RAILWAY_API_TOKEN;
    const projectId = process.env.RAILWAY_PROJECT_ID;
    const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    const templateRepo =
      process.env.OPENCLAW_TEMPLATE_REPO ||
      "arjunkomath/openclaw-railway-template";

    if (!apiToken || !projectId || !environmentId) {
      console.warn("Railway configuration is missing. Running in stub mode.");
      return {
        serviceId: `stub-${input.agentId}`,
        railwayDomain: null,
        logs: "Railway API token/project/environment not set. Stub mode.",
      };
    }

    try {
      // 1) Create a new Service for this Agent (from GitHub repo template)
      const serviceCreateQuery = `
        mutation serviceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
          }
        }
      `;

      const serviceRes = await this.graphqlRequestLabeled(
        apiToken,
        serviceCreateQuery,
        {
          input: {
            projectId,
            environmentId,
            name: `OpenClaw - Agent ${input.agentId.split("-")[0]}`,
            source: { repo: templateRepo },
          },
        },
        "serviceCreate",
      );
      const serviceId = serviceRes.data.serviceCreate.id;

      // 2) Create a Volume mounted at /data (required by the OpenClaw Railway template)
      const volumeCreateQuery = `
        mutation volumeCreate($input: VolumeCreateInput!) {
          volumeCreate(input: $input) {
            name
          }
        }
      `;
      try {
        await this.graphqlRequestLabeled(
          apiToken,
          volumeCreateQuery,
          {
            input: {
              projectId,
              environmentId,
              serviceId,
              mountPath: "/data",
            },
          },
          "volumeCreate",
        );
      } catch (error) {
        console.warn("[Railway] volumeCreate failed (continuing):", error);
      }

      // 3) Create a Railway-provided domain for this service (target port 8080)
      const serviceDomainCreateQuery = `
        mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
          serviceDomainCreate(input: $input) {
            domain
            environmentId
            serviceId
          }
        }
      `;
      let publicDomain: string | null = null;
      try {
        const domainRes = await this.graphqlRequestLabeled(
          apiToken,
          serviceDomainCreateQuery,
          {
            input: {
              environmentId,
              serviceId,
            },
          },
          "serviceDomainCreate",
        );
        publicDomain = domainRes?.data?.serviceDomainCreate?.domain ?? null;
      } catch (error) {
        console.warn("[Railway] serviceDomainCreate failed (continuing):", error);
      }

      // 4) Inject Environment Variables
      const upsertVarsQuery = `
        mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
      `;

      const variables = {
        // OpenClaw Railway template required vars
        PORT: "8080",
        SETUP_PASSWORD: input.setupPassword,
        OPENCLAW_STATE_DIR: "/data/.openclaw",
        OPENCLAW_WORKSPACE_DIR: "/data/workspace",
        OPENCLAW_GATEWAY_TOKEN: input.gatewayToken,
        // Avoid early OOM on small containers; should still be paired with Railway memory >= this value.
        NODE_OPTIONS: "--max-old-space-size=1024",

        // App-specific vars we can use later for automation / observability
        DEFAULT_MODEL: input.model,
        MESSAGING_CHANNEL: "telegram",
        PROVIDER_API_KEY: input.providerApiKey,
        ...(input.provider === "openai"
          ? { OPENAI_API_KEY: input.providerApiKey }
          : { ANTHROPIC_API_KEY: input.providerApiKey }),
        TELEGRAM_BOT_TOKEN: input.telegramBotToken,
        TELEGRAM_CHAT_ID: input.telegramChatId ?? "",
        // 1-click Telegram: allowlist the owning user id (no pairing step).
        TELEGRAM_USER_ID: input.telegramUserId,
        TELEGRAM_ALLOW_FROM: input.telegramUserId,
      };

      await this.graphqlRequestLabeled(
        apiToken,
        upsertVarsQuery,
        {
          input: {
            projectId,
            environmentId,
            serviceId,
            variables,
          },
        },
        "variableCollectionUpsert",
      );

      // 5) Trigger a deploy (ensures staged changes like variables are applied)
      const redeployQuery = `
        mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
          serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId) {
            status
          }
        }
      `;
      try {
        await this.graphqlRequestLabeled(
          apiToken,
          redeployQuery,
          {
            serviceId,
            environmentId,
          },
          "serviceInstanceRedeploy",
        );
      } catch (error) {
        console.warn("[Railway] serviceInstanceRedeploy failed (continuing):", error);
      }

      return {
        serviceId,
        railwayDomain: publicDomain,
        logs:
          "Service created from OpenClaw Railway template, volume attached, variables set, and redeploy triggered." +
          (publicDomain ? ` Public domain: https://${publicDomain}` : ""),
      };
    } catch (error) {
      console.error("[Railway] Deploy Error:", error);
      throw new Error(
        `Railway deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async finalizeSetup(input: {
    serviceId: string;
    railwayDomain: string | null;
    setupPassword: string;
    provider: "openai" | "anthropic";
    providerApiKey: string;
    model?: string;
    telegramBotToken: string;
    telegramUserId: string;
  }) {
    let domain = input.railwayDomain;
    if (!domain) {
      const apiToken = process.env.RAILWAY_API_TOKEN;
      const projectId = process.env.RAILWAY_PROJECT_ID;
      const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
      if (!apiToken || !projectId || !environmentId) {
        throw new Error("Railway env vars missing to create a domain");
      }

      const serviceDomainCreateQuery = `
        mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
          serviceDomainCreate(input: $input) {
            domain
            environmentId
            serviceId
          }
        }
      `;
      const domainRes = await this.graphqlRequestLabeled(
        apiToken,
        serviceDomainCreateQuery,
        {
          input: {
            environmentId,
            serviceId: input.serviceId,
          },
        },
        "serviceDomainCreate(finalize)",
      );

      domain = domainRes?.data?.serviceDomainCreate?.domain ?? "";
      if (!domain) {
        throw new Error(
          "Railway did not return a public domain. Generate a domain in Railway UI and try finalize again.",
        );
      }
    }

    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    // Railway template builds can take 7+ minutes before the public domain routes to the new container.
    const maxWaitMs = 900_000;
    const startedAt = Date.now();
    let lastWaitError: string | null = null;
    let wrapperReachable = false;

    // Wait for template wrapper to be reachable.
    while (Date.now() - startedAt < maxWaitMs) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${baseUrl}/setup/healthz`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(t);
        if (res.ok) {
          wrapperReachable = true;
          lastWaitError = null;
          break;
        }

        // Some deployments briefly return 404 on /setup/healthz while the domain is propagating.
        // Fall back to probing /setup itself (401/403 is fine: it means Basic Auth is up).
        if (res.status === 404) {
          const res2 = await fetch(`${baseUrl}/setup`, {
            method: "GET",
            signal: controller.signal,
            redirect: "manual",
          });
          if ([200, 401, 403, 302, 307, 308].includes(res2.status)) {
            wrapperReachable = true;
            lastWaitError = null;
            break;
          }
          lastWaitError = `/setup HTTP ${res2.status}`;
        } else {
          lastWaitError = `healthz HTTP ${res.status}`;
        }
      } catch {
        // ignore transient
        lastWaitError = "healthz fetch failed";
      }
      await new Promise((r) => setTimeout(r, 3500));
    }

    if (!wrapperReachable) {
      throw new Error(
        `OpenClaw wrapper did not become reachable in time (${maxWaitMs}ms). Last error: ${lastWaitError ?? "unknown"}`,
      );
    }

    const authChoice = input.provider === "openai" ? "openai-api-key" : "apiKey";
    const basic = Buffer.from(`:${input.setupPassword}`).toString("base64");

    const payload: Record<string, any> = {
      flow: "quickstart",
      authChoice,
      authSecret: input.providerApiKey,
      telegramToken: input.telegramBotToken,
      // These fields are meant for our forked template (no pairing).
      telegramDmPolicy: "allowlist",
      telegramAllowFrom: [input.telegramUserId],
    };
    if (input.model) payload.model = input.model;

    const maxAttempts = 5;
    let lastErrorDetail = "";
    let output = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const runRes = await fetch(`${baseUrl}/setup/api/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${basic}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await runRes.json().catch(() => null);
      const detail =
        (body?.output ?? body?.error ?? (body ? JSON.stringify(body) : "")) ||
        (await runRes.text().catch(() => "")) ||
        String(runRes.status);

      if (runRes.ok) {
        output = body?.output ? String(body.output) : "";
        lastErrorDetail = "";
        break;
      }

      lastErrorDetail = String(detail);

      const looksLikeSlowBoot = /gateway did not become ready in time/i.test(
        lastErrorDetail,
      );
      if (!looksLikeSlowBoot || attempt === maxAttempts) {
        throw new Error(`OpenClaw setup failed: ${lastErrorDetail}`);
      }

      // Backoff to allow Railway to finish booting internal gateway processes.
      const waitMs = 12_000 + attempt * 8_000;
      await new Promise((r) => setTimeout(r, waitMs));
    }

    // After setup, wait until the wrapper reports "configured" if available.
    // This makes our "RUNNING" status closer to "bot is actually ready".
    const readyDeadlineMs = 180_000;
    const readyStartedAt = Date.now();
    while (Date.now() - readyStartedAt < readyDeadlineMs) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${baseUrl}/setup/healthz`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(t);
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        const maybeJson = await res.json().catch(() => null);
        const configured =
          typeof maybeJson?.configured === "boolean" ? maybeJson.configured : null;
        if (configured === null || configured === true) {
          break;
        }
      } catch {
        // ignore transient
      }
      await new Promise((r) => setTimeout(r, 3000));
    }

    return {
      railwayDomain: domain,
      logs:
        `OpenClaw setup finalized for ${baseUrl}.\n` +
        (output ? `\n--- setup output ---\n${output}` : ""),
    };
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
    return this.graphqlRequestLabeled(token, query, variables, "graphql");
  }

  private async graphqlRequestLabeled(
    token: string,
    query: string,
    variables: any,
    label: string,
  ) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`[Railway:${label}] HTTP ${response.status} ${text}`);
    }

    const body = await response.json();
    if (body.errors && body.errors.length > 0) {
      const first = body.errors[0] ?? {};
      const msg = first.message ?? "Railway GraphQL error";
      const trace = first.traceId ? ` traceId=${first.traceId}` : "";
      if (/not authorized|forbidden|unauthorized/i.test(msg)) {
        throw new Error(
          `[Railway:${label}] ${msg}${trace}. Verifique se RAILWAY_API_TOKEN e um Personal/Team token (nao Project token) com permissao de criar services/volumes/domains.`,
        );
      }
      throw new Error(`[Railway:${label}] ${msg}${trace}`);
    }
    if (!body.data) {
      throw new Error(`[Railway:${label}] Missing data in response`);
    }
    return body;
  }
}
