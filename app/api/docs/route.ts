import { ok } from "@/src/interfaces/http/http";

export async function GET() {
  return ok({
    openapi: "3.0.3",
    info: {
      title: "Simpleclaw Sync API",
      version: "0.1.0"
    },
    paths: {
      "/api/agents": {
        get: { summary: "Lista agentes do usuário" },
        post: { summary: "Cria agente (DRAFT)" }
      },
      "/api/agents/{id}": {
        get: { summary: "Obtém agente por id" }
      },
      "/api/agents/{id}/config": {
        post: { summary: "Configura secrets e muda para CONFIGURED" }
      },
      "/api/agents/{id}/deploy": {
        post: { summary: "Inicia deploy no Railway" }
      },
      "/api/agents/{id}/logs": {
        get: { summary: "Obtém logs do último deployment" }
      },
      "/api/agents/{id}/restart": {
        post: { summary: "Reinicia serviço do agente" }
      }
    }
  });
}
