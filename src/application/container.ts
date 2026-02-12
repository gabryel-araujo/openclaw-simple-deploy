import { AgentService } from "@/src/application/agent/service";
import { AesEncryptionService } from "@/src/infrastructure/crypto/aes-encryption-service";
import { RailwayDeploymentGateway } from "@/src/infrastructure/deploy/railway-deployment-gateway";
import { DrizzleAgentRepository } from "@/src/infrastructure/repositories/drizzle-agent-repository";

let singleton: AgentService | null = null;

export function getAgentService() {
  if (singleton) {
    return singleton;
  }

  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    throw new Error("APP_SECRET is required");
  }

  singleton = new AgentService(
    new DrizzleAgentRepository(),
    new RailwayDeploymentGateway(),
    new AesEncryptionService(appSecret)
  );

  return singleton;
}
