import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { tenants } from "@/shared/db/schemas";

const DEFAULT_MIN_STRING_LENGTH = 2;
const DEFAULT_MAX_STRING_LENGTH = 255;

export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);

export const createTenantSchema = insertTenantSchema
  .omit({ createdAt: true, id: true, ownerId: true, updatedAt: true })
  .extend({
    email: z
      .email()
      .max(DEFAULT_MAX_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    name: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    phone: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
  });

export const updateTenantSchema = createTenantSchema.partial();

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = z.infer<typeof selectTenantSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
