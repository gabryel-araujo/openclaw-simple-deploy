export const AGENT_STATUS = {
  DRAFT: "DRAFT",
  CONFIGURED: "CONFIGURED",
  DEPLOYING: "DEPLOYING",
  RUNNING: "RUNNING",
  FAILED: "FAILED",
  STOPPED: "STOPPED"
} as const;

export type AgentStatus = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export const PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic"
} as const;

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS];

export type Channel = "telegram";

export type Agent = {
  id: string;
  userId: string;
  name: string;
  model: string;
  channel: Channel;
  status: AgentStatus;
  railwayServiceId: string | null;
  railwayDomain: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AgentSecret = {
  id: string;
  agentId: string;
  provider: Provider;
  encryptedApiKey: string;
  telegramBotToken: string;
  telegramChatId: string | null;
  telegramUserId: string | null;
  setupPassword: string | null;
  gatewayToken: string | null;
  createdAt: Date;
};

export type Deployment = {
  id: string;
  agentId: string;
  status: "started" | "success" | "failed";
  logs: string | null;
  createdAt: Date;
};
