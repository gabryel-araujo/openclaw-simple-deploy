import { NextRequest, NextResponse } from "next/server";

interface TelegramGetMeResult {
  ok: boolean;
  result?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  description?: string;
}

/**
 * POST /api/telegram/validate-token
 *
 * Body: { token: string }
 *
 * Validates a Telegram Bot token by calling the Telegram Bot API (getMe).
 * Returns bot info if valid, error if not.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error: "Token é obrigatório." },
        { status: 400 }
      );
    }

    // Basic format check: Telegram tokens look like "123456789:ABCdef..."
    const tokenRegex = /^\d{8,12}:[A-Za-z0-9_-]{35,}$/;
    if (!tokenRegex.test(token.trim())) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Formato de token inválido. O token deve ter o formato: 123456789:ABCdef...",
        },
        { status: 400 }
      );
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token.trim()}/getMe`,
      { method: "GET" }
    );

    const data: TelegramGetMeResult = await telegramRes.json();

    if (!data.ok || !data.result?.is_bot) {
      return NextResponse.json(
        {
          valid: false,
          error: "Token inválido. Verifique o token gerado pelo BotFather.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      bot: {
        id: data.result.id,
        username: data.result.username,
        name: data.result.first_name,
      },
    });
  } catch (error) {
    console.error("[telegram/validate-token] Error:", error);
    return NextResponse.json(
      { valid: false, error: "Erro ao validar token. Tente novamente." },
      { status: 500 }
    );
  }
}
