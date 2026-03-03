import { getAgentService } from "@/src/application/container";
import {
  HttpError,
  getUserIdFromHeaders,
  handleApiError,
  ok,
} from "@/src/interfaces/http/http";
import { configAgentSchema } from "@/src/interfaces/http/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const payload = configAgentSchema.safeParse(body);
    if (!payload.success) {
      throw new HttpError(
        400,
        payload.error.issues[0]?.message ?? "Invalid payload",
      );
    }

    const service = getAgentService();
    const userId = getUserIdFromHeaders(request.headers);
    const agent = await service.configureAgent({
      userId,
      agentId: id,
      provider: payload.data.provider ?? "openai",
      apiKey: payload.data.apiKey ?? "",
      telegramBotToken: payload.data.telegramBotToken ?? "",
      telegramUserId: payload.data.telegramUserId ?? "",
      telegramChatId: payload.data.telegramChatId ?? undefined,
    });

    return ok({ agent });
  } catch (error) {
    return handleApiError(error);
  }
}
