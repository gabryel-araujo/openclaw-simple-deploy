import { getAgentService } from "@/src/application/container";
import { getUserIdFromHeaders, handleApiError, ok } from "@/src/interfaces/http/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromHeaders(request.headers);
    const service = getAgentService();
    const password = await service.getSetupPassword(userId, id);
    return ok({ password });
  } catch (error) {
    return handleApiError(error);
  }
}

