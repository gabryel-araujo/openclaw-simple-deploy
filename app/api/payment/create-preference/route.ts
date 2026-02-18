import { getPlanById } from "@/src/domain/payment/plans";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/create-preference
 *
 * Body: { planId: string }
 *
 * The price is NEVER sent by the client. The backend resolves it
 * from the server-side plan dictionary to prevent price tampering.
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado. Contate o suporte." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { planId } = body as { planId: string };

    if (!planId) {
      return NextResponse.json(
        { error: "planId é obrigatório." },
        { status: 400 }
      );
    }

    // Resolve price server-side — client never sends the amount
    const plan = getPlanById(planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const isLocalhost = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: plan.id,
            title: plan.title,
            description: plan.description,
            quantity: 1,
            unit_price: plan.amount,
            currency_id: plan.currency,
          },
        ],
        // Mercado Pago requires public URLs — skip entirely on localhost
        ...(!isLocalhost && {
          back_urls: {
            success: `${appUrl}/dashboard?payment=success`,
            failure: `${appUrl}/?payment=failure`,
            pending: `${appUrl}/?payment=pending`,
          },
          auto_return: "approved" as const,
          notification_url: `${appUrl}/api/payment/webhook`,
        }),
        metadata: {
          plan_id: plan.id,
        },
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    // Log the full error so we can see the real Mercado Pago message
    console.error("[payment/create-preference] Full error:", JSON.stringify(error, null, 2));

    // Extract a meaningful message from the MP error response
    let detail = "Erro ao criar preferência de pagamento.";
    if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      // Mercado Pago SDK wraps errors with .cause or .message
      if (e.cause) detail = JSON.stringify(e.cause);
      else if (e.message && typeof e.message === "string") detail = e.message;
    }

    return NextResponse.json(
      {
        error: "Erro ao criar preferência de pagamento.",
        // Only expose detail in development to help debug
        ...(process.env.NODE_ENV === "development" && { detail }),
      },
      { status: 500 }
    );
  }
}
