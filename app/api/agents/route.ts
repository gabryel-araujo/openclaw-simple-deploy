import { getAgentService } from "@/src/application/container";
import { HttpError, getUserIdFromHeaders, handleApiError, ok } from "@/src/interfaces/http/http";
import { createAgentSchema } from "@/src/interfaces/http/schemas";

export async function GET(request: Request) {
  try {
    const service = getAgentService();
    const userId = getUserIdFromHeaders(request.headers);
    const agents = await service.listByUser(userId);
    return ok({ agents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createAgentSchema.safeParse(body);
    if (!payload.success) {
      throw new HttpError(400, payload.error.issues[0]?.message ?? "Invalid payload");
    }

    const service = getAgentService();
    const userId = getUserIdFromHeaders(request.headers);
    const agent = await service.createAgent({
      userId,
      ...payload.data
    });
    return ok({ agent }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
