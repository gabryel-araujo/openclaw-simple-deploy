import { db } from "@/src/infrastructure/db/client";
import { paymentsTable } from "@/src/infrastructure/db/schema";
import { createClient as createSupabaseServerClient } from "@/src/infrastructure/auth/supabase";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/payment/history
 *
 * Returns the last 10 payments for the authenticated user.
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

    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, user.id))
      .orderBy(desc(paymentsTable.createdAt))
      .limit(10);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        status: p.status,
        amount: p.amount,
        planId: p.planId,
        createdAt: p.createdAt.toISOString(),
        validUntil: (() => {
          const d = new Date(p.createdAt);
          d.setDate(d.getDate() + 30);
          return d.toISOString();
        })(),
      })),
    });
  } catch (error) {
    console.error("[payment/history] Error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico de pagamentos." },
      { status: 500 },
    );
  }
}
