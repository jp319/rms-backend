import { desc, eq } from "drizzle-orm";

import type {
  CreatePaymentInput,
  Payment,
} from "@/modules/payments/payments.schema";

import env from "@/env";
import createDb from "@/shared/db";
import { payments } from "@/shared/db/schemas";

const db = createDb(env);

export const paymentsRepository = {
  create: async (
    leaseId: number,
    input: CreatePaymentInput,
  ): Promise<Payment | undefined> => {
    const [payment] = await db
      .insert(payments)
      .values({ ...input, leaseId })
      .returning();
    return payment;
  },

  findByLeaseId: async (leaseId: number): Promise<Payment[]> => {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.leaseId, leaseId))
      .orderBy(desc(payments.datePaid));
  },
};
