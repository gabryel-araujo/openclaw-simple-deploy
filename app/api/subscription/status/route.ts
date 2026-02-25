import { getSubscriptionRepository } from "@/src/application/container";
import { createClient as createSupabaseServerClient } from "@/src/infrastructure/auth/supabase";
import { NextResponse } from "next/server";

/**
 * GET /api/subscription/status
 *
 * Returns the authenticated user's current subscription status.
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
      });
    }

    return NextResponse.json({
      active: subscription.status === "authorized",
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
