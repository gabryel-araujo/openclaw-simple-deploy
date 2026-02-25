import { db } from "@/src/infrastructure/db/client";
import { paymentsTable } from "@/src/infrastructure/db/schema";
import {
  getAgentService,
  getSubscriptionRepository,
} from "@/src/application/container";
import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/webhook
 *
 * Receives Mercado Pago IPN/Webhook notifications.
 * Handles both `payment` and `preapproval` event types.
 *
 * When a subscription status changes to paused/cancelled,
 * all the user's agents are stopped automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { type, data } = body as {
      type: string;
      data: { id: string };
    };

    console.log("[payment/webhook] Received notification:", { type, data });

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("[payment/webhook] Missing MERCADO_PAGO_ACCESS_TOKEN");
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({ accessToken });

    // ── Handle payment notifications ──
    if (type === "payment") {
      const paymentId = data?.id;

      if (paymentId) {
        const payment = new Payment(client);
        const result = await payment.get({ id: paymentId });

        if (result?.id && result?.status) {
          await db
            .update(paymentsTable)
            .set({ status: result.status })
            .where(eq(paymentsTable.transactionId, result.id.toString()));
        }

        console.log(
          "[payment/webhook] Payment updated:",
          paymentId,
          result?.status,
        );
      }
    }

    // ── Handle subscription (preapproval) notifications ──
    if (type === "preapproval") {
      const preapprovalId = data?.id;

      if (preapprovalId) {
        const preApproval = new PreApproval(client);
        const result = await preApproval.get({ id: preapprovalId });

        if (result?.id && result?.status) {
          const subRepo = getSubscriptionRepository();

          // Update subscription status in our DB
          const updatedSub = await subRepo.updateStatus(
            result.id,
            result.status,
            result.next_payment_date
              ? new Date(result.next_payment_date)
              : undefined,
          );

          console.log(
            "[payment/webhook] Subscription updated:",
            result.id,
            result.status,
          );

          // If subscription is no longer authorized → stop all user's agents
          if (
            updatedSub &&
            result.status !== "authorized" &&
            result.status !== "pending"
          ) {
            try {
              const agentService = getAgentService();
              await agentService.stopAllAgents(updatedSub.userId);
              console.log(
                "[payment/webhook] Stopped agents for user:",
                updatedSub.userId,
              );
            } catch (stopError) {
              console.error(
                "[payment/webhook] Error stopping agents:",
                stopError,
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[payment/webhook] Error:", error);
    // Always return 200 to Mercado Pago to avoid retries on our errors
    return NextResponse.json({ received: true });
  }
}
