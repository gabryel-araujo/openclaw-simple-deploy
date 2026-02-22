import { NextRequest, NextResponse } from "next/server";

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id: number; type?: string; title?: string; username?: string };
  };
  channel_post?: {
    chat?: { id: number; type?: string; title?: string; username?: string };
  };
};

type TelegramGetUpdatesResult = {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
};

/**
 * POST /api/telegram/resolve-chat
 *
 * Body: { token: string }
 *
 * Attempts to resolve a chat id by reading recent updates from Telegram (getUpdates).
 * Requires that the bot has received at least one message/event.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token e obrigatorio." },
        { status: 400 },
      );
    }

    const tokenTrimmed = token.trim();
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${tokenTrimmed}/getUpdates?limit=10`,
      { method: "GET" },
    );

    const data: TelegramGetUpdatesResult = await telegramRes.json();
    if (!data.ok) {
      return NextResponse.json(
        { error: data.description ?? "Falha ao consultar Telegram." },
        { status: 400 },
      );
    }

    const updates = data.result ?? [];
    for (let index = updates.length - 1; index >= 0; index--) {
      const update = updates[index];
      const chat =
        update.message?.chat ?? update.channel_post?.chat ?? undefined;
      if (chat?.id) {
        return NextResponse.json({
          chatId: String(chat.id),
          chatType: chat.type ?? null,
          chatTitle: chat.title ?? null,
          chatUsername: chat.username ?? null,
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "Nao encontramos um chat recente. Envie uma mensagem para o bot e tente novamente.",
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("[telegram/resolve-chat] Error:", error);
    return NextResponse.json(
      { error: "Erro ao resolver chat. Tente novamente." },
      { status: 500 },
    );
  }
}

