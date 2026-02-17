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

export const updateLeaseSchema = insertLeaseSchema
  .omit({
    createdAt: true,
    id: true,
    unitId: true,
    updatedAt: true,
  })
  .extend({
    endDate: z.coerce.date().optional(),
    monthlyRent: z
      .number()
      .positive("Rent must be a positive number")
      .optional(),
    securityDeposit: z
      .number()
      .positive("Security deposit must be a positive number")
      .optional(),
    startDate: z.coerce.date().optional(),
    tenantId: z
      .number()
      .positive("Tenant ID must be a positive number")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      // Returns true only if both are present OR both are missing
      return !!data.startDate === !!data.endDate;
    },
    {
      message: "Start Date and End Date must be provided together",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export type Lease = typeof leases.$inferSelect;
export type NewLease = z.infer<typeof selectLeaseSchema>;
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
