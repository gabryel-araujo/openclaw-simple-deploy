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
          const transactionId = result.id.toString();

          // Try to update first; if no row was affected, insert (upsert)
          // This covers recurring subscription payments that were never inserted by the /process route
          const existing = await db
            .select({ id: paymentsTable.id })
            .from(paymentsTable)
            .where(eq(paymentsTable.transactionId, transactionId))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(paymentsTable)
              .set({ status: result.status })
              .where(eq(paymentsTable.transactionId, transactionId));
            console.log(
              "[payment/webhook] Payment updated:",
              transactionId,
              result.status,
            );
          } else {
            // Recurring payment not previously in our DB — look up subscription to get userId
            const subRepo = getSubscriptionRepository();
            const preapprovalId =
              (result as any).preapproval_id ??
              (result as any).point_of_interaction?.subscription_data
                ?.preapproval_id;

            let userId: string | null = null;
            if (preapprovalId) {
              const sub = await subRepo.findByPreapprovalId(preapprovalId);
              userId = sub?.userId ?? null;
            }

            if (userId) {
              await db.insert(paymentsTable).values({
                userId,
                transactionId,
                status: result.status,
                amount: result.transaction_amount?.toString() ?? "0",
                planId: "pro-monthly",
              });
              console.log(
                "[payment/webhook] Payment inserted (recurring):",
                transactionId,
                result.status,
                "userId:",
                userId,
              );
            } else {
              console.warn(
                "[payment/webhook] Could not determine userId for payment:",
                transactionId,
              );
            }
          }
        }
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
