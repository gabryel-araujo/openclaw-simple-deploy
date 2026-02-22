import { db } from "@/src/infrastructure/db/client";
import { paymentsTable } from "@/src/infrastructure/db/schema";
import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/webhook
 *
 * Receives Mercado Pago IPN/Webhook notifications.
 * Configure this URL in the Mercado Pago developer panel.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { type, data } = body as {
      type: string;
      data: { id: string };
    };

    console.log("[payment/webhook] Received notification:", { type, data });

    if (type === "payment") {
      const paymentId = data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!accessToken) {
        console.error("[payment/webhook] Missing MERCADO_PAGO_ACCESS_TOKEN");
        return NextResponse.json({ received: true });
      }

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      const result = await payment.get({ id: paymentId });

      if (result?.id && result?.status) {
        await db
          .update(paymentsTable)
          .set({ status: result.status })
          .where(eq(paymentsTable.transactionId, result.id.toString()));
      }

      console.log("[payment/webhook] Payment ID:", paymentId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[payment/webhook] Error:", error);
    // Always return 200 to Mercado Pago to avoid retries on our errors
    return NextResponse.json({ received: true });
  }
}
