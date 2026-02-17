import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { payments } from "@/shared/db/schemas";

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export const createPaymentSchema = insertPaymentSchema
  .omit({
    createdAt: true,
    id: true,
    updatedAt: true,
    leaseId: true,
  })
  .extend({
    amount: z.coerce.number().positive("Amount must be a positive"),
    datePaid: z.coerce.date(),
    paymentType: z.enum(["damages", "deposit", "rent"]),
    notes: z.string().max(255).optional(),
    receiptUrl: z.url().optional(),
  });

export type Payment = typeof payments.$inferSelect;
export type NewPayment = z.infer<typeof selectPaymentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
