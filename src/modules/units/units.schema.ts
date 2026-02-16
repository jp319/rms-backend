import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { properties, units } from "@/shared/db/schemas";

const DEFAULT_MONTHLY_RENT = 0;
const DEFAULT_MIN_INTEGER = 1;

export const insertUnitSchema = createInsertSchema(units);
export const selectUnitSchema = createSelectSchema(units);

export const createUnitSchema = insertUnitSchema
  .omit({
    createdAt: true,
    id: true,
    propertyId: true,
    updatedAt: true,
  })
  .extend({
    monthlyRent: z.int().min(DEFAULT_MONTHLY_RENT),
    unitNumber: z.int().min(DEFAULT_MIN_INTEGER),
  });

export const updateUnitSchema = createUnitSchema.partial();

export const getUnitWithPropertySchema = selectUnitSchema.extend({
  property: properties.$inferSelect,
});

export type Unit = typeof units.$inferSelect;
export type NewUnit = z.infer<typeof selectUnitSchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitWithProperty = z.infer<typeof getUnitWithPropertySchema>;
