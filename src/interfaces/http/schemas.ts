import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2).max(80),
  model: z.string().min(2),
  channel: z.literal("telegram")
});

export const configAgentSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  apiKey: z.string().min(10),
  telegramBotToken: z.string().min(10),
  telegramUserId: z.string().min(2),
  telegramChatId: z.string().min(2).optional(),
});
