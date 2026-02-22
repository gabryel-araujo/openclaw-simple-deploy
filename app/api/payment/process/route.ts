import { db } from "@/src/infrastructure/db/client";
import { paymentsTable } from "@/src/infrastructure/db/schema";
import { getPlanById } from "@/src/domain/payment/plans";
import { createClient as createSupabaseServerClient } from "@/src/infrastructure/auth/supabase";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/process
 *
 * Handles transparent checkout for both Card and Pix payments.
 * The price is NEVER sent by the client — resolved server-side from planId.
 */
export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { token, payment_method_id, issuer_id, installments, payer, planId } =
      body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId é obrigatório." },
        { status: 400 },
      );
    }

    if (!payer?.email) {
      return NextResponse.json(
        { error: "E-mail do pagador é obrigatório." },
        { status: 400 },
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

    // Security: resolve price server-side — client never sends the amount
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const isPix = payment_method_id === "pix";

    // Build payment body depending on method
    const paymentBody: Record<string, any> = {
      transaction_amount: plan.amount,
      description: plan.title,
      payment_method_id: isPix ? "pix" : payment_method_id,
      payer: {
        email: payer.email,
        identification: payer.identification
          ? {
              type: payer.identification.type,
              number: payer.identification.number,
            }
          : undefined,
      },
    };

    // Card-specific fields
    if (!isPix) {
      if (!token) {
        return NextResponse.json(
          { error: "Token do cartão é obrigatório." },
          { status: 400 },
        );
      }
      paymentBody.token = token;
      paymentBody.issuer_id = issuer_id;
      paymentBody.installments = installments || 1;
    }

    const result = await payment.create({ body: paymentBody });

    // Store payment in database (non-blocking — don't fail payment if DB has issues)
    try {
      await db.insert(paymentsTable).values({
        userId: user.id,
        transactionId: result.id!.toString(),
        status: result.status!,
        amount: result.transaction_amount!.toString(),
        planId: plan.id,
      });
    } catch (dbError) {
      console.error(
        "[payment/process] DB insert failed (non-blocking):",
        dbError,
      );
    }

    // Build response
    const response: Record<string, any> = {
      status: result.status,
      id: result.id,
      detail: result.status_detail,
    };

    // Pix: include QR code data
    if (isPix && result.point_of_interaction?.transaction_data) {
      const txData = result.point_of_interaction.transaction_data;
      response.pixQrCode = txData.qr_code;
      response.pixQrCodeBase64 = txData.qr_code_base64;
      response.ticketUrl = txData.ticket_url;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[payment/process] Error:", JSON.stringify(error, null, 2));

    let detail = "Erro ao processar pagamento.";
    if (error?.cause) detail = JSON.stringify(error.cause);
    else if (error?.message) detail = error.message;

    return NextResponse.json(
      {
        error: "Erro ao processar pagamento.",
        ...(process.env.NODE_ENV === "development" && { detail }),
      },
      { status: 500 },
    );
  }
}
