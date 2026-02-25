import { desc, eq } from "drizzle-orm";
import { db } from "@/src/infrastructure/db/client";
import { subscriptionsTable } from "@/src/infrastructure/db/schema";

export interface Subscription {
  id: string;
  userId: string;
  mpPreapprovalId: string;
  status: string;
  planId: string;
  maxAgents: number;
  nextPaymentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionRepository {
  async findByUser(userId: string): Promise<Subscription | null> {
    const [row] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    return row ? this.toSubscription(row) : null;
  }

  async findByPreapprovalId(
    mpPreapprovalId: string,
  ): Promise<Subscription | null> {
    const [row] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.mpPreapprovalId, mpPreapprovalId))
      .limit(1);

    return row ? this.toSubscription(row) : null;
  }

  async create(input: {
    userId: string;
    mpPreapprovalId: string;
    status: string;
    planId: string;
    maxAgents: number;
    nextPaymentDate?: Date | null;
  }): Promise<Subscription> {
    const [row] = await db
      .insert(subscriptionsTable)
      .values({
        userId: input.userId,
        mpPreapprovalId: input.mpPreapprovalId,
        status: input.status,
        planId: input.planId,
        maxAgents: input.maxAgents,
        nextPaymentDate: input.nextPaymentDate ?? null,
      })
      .returning();

    return this.toSubscription(row);
  }

  async updateStatus(
    mpPreapprovalId: string,
    status: string,
    nextPaymentDate?: Date | null,
  ): Promise<Subscription | null> {
    const values: {
      status: string;
      updatedAt: Date;
      nextPaymentDate?: Date | null;
    } = { status, updatedAt: new Date() };

    if (nextPaymentDate !== undefined) {
      values.nextPaymentDate = nextPaymentDate;
    }

    const [row] = await db
      .update(subscriptionsTable)
      .set(values)
      .where(eq(subscriptionsTable.mpPreapprovalId, mpPreapprovalId))
      .returning();

    return row ? this.toSubscription(row) : null;
  }

  private toSubscription(
    row: typeof subscriptionsTable.$inferSelect,
  ): Subscription {
    return {
      id: row.id,
      userId: row.userId,
      mpPreapprovalId: row.mpPreapprovalId,
      status: row.status,
      planId: row.planId,
      maxAgents: row.maxAgents,
      nextPaymentDate: row.nextPaymentDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
