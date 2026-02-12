import { getAgentService } from "@/src/application/container";
import { getUserIdFromHeaders, handleApiError, ok } from "@/src/interfaces/http/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromHeaders(request.headers);
    const service = getAgentService();
    const agent = await service.restartAgent(userId, id);
    return ok({ agent });
  } catch (error) {
    return handleApiError(error);
  }
}
