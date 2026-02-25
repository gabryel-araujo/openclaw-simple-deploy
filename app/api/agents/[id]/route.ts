import { getAgentService } from "@/src/application/container";
import {
  handleApiError,
  ok,
  getUserIdFromHeaders,
} from "@/src/interfaces/http/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromHeaders(request.headers);
    const service = getAgentService();
    const agent = await service.getAgent(userId, id);
    return ok({ agent });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromHeaders(request.headers);
    const service = getAgentService();
    await service.deleteAgent(userId, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
