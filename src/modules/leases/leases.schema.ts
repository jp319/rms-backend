import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { leases } from "@/shared/db/schemas";

export const insertLeaseSchema = createInsertSchema(leases);
export const selectLeaseSchema = createSelectSchema(leases);

export const createLeaseSchema = insertLeaseSchema
  .omit({
    createdAt: true,
    id: true,
    unitId: true,
    updatedAt: true,
  })
  .extend({
    endDate: z.coerce.date(),
    monthlyRent: z.number().positive("Rent must be a positive number"),
    securityDeposit: z
      .number()
      .positive("Security deposit must be a positive number"),
    startDate: z.coerce.date(),
    tenantId: z.number().positive("Tenant ID must be a positive number"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"], // This attaches the error specifically to the 'endDate' field
  });

export const updateLeaseSchema = createLeaseSchema;

export type Lease = typeof leases.$inferSelect;
export type NewLease = z.infer<typeof selectLeaseSchema>;
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
