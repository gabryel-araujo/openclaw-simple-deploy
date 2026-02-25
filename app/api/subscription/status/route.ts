import { db } from "@/src/infrastructure/db/client";
import { paymentsTable } from "@/src/infrastructure/db/schema";
import { getSubscriptionRepository } from "@/src/application/container";
import { createClient as createSupabaseServerClient } from "@/src/infrastructure/auth/supabase";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/subscription/status
 *
 * Returns the authenticated user's current subscription status.
 *
 * A subscription is considered active when EITHER:
 *  A) The subscription record has status "authorized" AND there is at least
 *     one payment with status "approved" whose created_at is within the last 30 days.
 *  B) The subscription record has status "authorized" AND it was updated
 *     (or has a nextPaymentDate) within the last 30 days — to cover recurring
 *     subscription payments that may not appear in our payments table directly.
 */
export async function GET() {
  try {
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

    const repo = getSubscriptionRepository();
    const subscription = await repo.findByUser(user.id);

    if (!subscription) {
      return NextResponse.json({
        active: false,
        subscription: null,
        validUntil: null,
      });
    }

    const now = new Date();

    // ── Path A: Check payments table for an approved payment within 30 days ──
    const [lastApprovedPayment] = await db
      .select()
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.userId, user.id),
          eq(paymentsTable.status, "approved"),
        ),
      )
      .orderBy(desc(paymentsTable.createdAt))
      .limit(1);

    let validUntil: Date | null = null;

    if (lastApprovedPayment) {
      const expiresAt = new Date(lastApprovedPayment.createdAt);
      expiresAt.setDate(expiresAt.getDate() + 30);
      if (now < expiresAt) {
        validUntil = expiresAt;
      }
    }

    // ── Path B: Fallback — use subscription own dates (covers recurring preapproval payments) ──
    // If the subscription is authorized and its nextPaymentDate is in the future,
    // or it was recently updated (within 30 days), treat it as valid.
    if (!validUntil && subscription.status === "authorized") {
      // Case B1: nextPaymentDate is in the future → payment was collected recently
      if (subscription.nextPaymentDate && subscription.nextPaymentDate > now) {
        // validUntil = nextPaymentDate (the subscription is active until then)
        validUntil = subscription.nextPaymentDate;
      }

      // Case B2: subscription was updated within the last 30 days (first payment scenario)
      if (!validUntil) {
        const subUpdatedAt = subscription.updatedAt ?? subscription.createdAt;
        const subExpiry = new Date(subUpdatedAt);
        subExpiry.setDate(subExpiry.getDate() + 30);
        if (now < subExpiry) {
          validUntil = subExpiry;
        }
      }
    }

    const active = subscription.status === "authorized" && validUntil !== null;

    return NextResponse.json({
      active,
      validUntil: validUntil?.toISOString() ?? null,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        maxAgents: subscription.maxAgents,
        nextPaymentDate: subscription.nextPaymentDate?.toISOString() ?? null,
        createdAt: subscription.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[subscription/status] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status da assinatura." },
      { status: 500 },
    );
  }
}
