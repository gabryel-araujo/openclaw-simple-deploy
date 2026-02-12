import { getAgentService } from "@/src/application/container";
import { randomUUID } from "crypto";
import { getUserIdFromHeaders, handleApiError, ok } from "@/src/interfaces/http/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromHeaders(request.headers);
    const service = getAgentService();
    const { agent } = await service.deployAgent(userId, id);
    return ok({ deploymentId: randomUUID(), agent });
  } catch (error) {
    return handleApiError(error);
  }
}
