import { getPlanById } from "@/src/domain/payment/plans";
import { getSubscriptionRepository } from "@/src/application/container";
import { createClient as createSupabaseServerClient } from "@/src/infrastructure/auth/supabase";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/create-preference
 *
 * Creates a Mercado Pago recurring subscription (PreApproval).
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
        { status: 503 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { planId } = body as { planId: string };

    if (!planId) {
      return NextResponse.json(
        { error: "planId é obrigatório." },
        { status: 400 },
      );
    }

    // Resolve price server-side — client never sends the amount
    const plan = getPlanById(planId);

    if (!plan) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    // Check if user already has an active subscription
    const subRepo = getSubscriptionRepository();
    const existingSub = await subRepo.findByUser(user.id);
    if (existingSub && existingSub.status === "authorized") {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa." },
        { status: 409 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const client = new MercadoPagoConfig({ accessToken });
    const preApproval = new PreApproval(client);

    const result = await preApproval.create({
      body: {
        reason: plan.title,
        external_reference: user.id,
        payer_email: user.email ?? undefined,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.amount,
          currency_id: plan.currency,
        },
        back_url: `${appUrl}/dashboard?subscription=success`,
      },
    });

    // Save subscription record with initial status
    if (result.id) {
      await subRepo.create({
        userId: user.id,
        mpPreapprovalId: result.id,
        status: result.status ?? "pending",
        planId: plan.id,
        maxAgents: plan.maxAgents,
        nextPaymentDate: result.next_payment_date
          ? new Date(result.next_payment_date)
          : null,
      });
    }

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error(
      "[payment/create-preference] Full error:",
      JSON.stringify(error, null, 2),
    );

    let detail = "Erro ao criar assinatura.";
    if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      if (e.cause) detail = JSON.stringify(e.cause);
      else if (e.message && typeof e.message === "string") detail = e.message;
    }

    return NextResponse.json(
      {
        error: "Erro ao criar assinatura.",
        ...(process.env.NODE_ENV === "development" && { detail }),
      },
      { status: 500 },
    );
  }
}
