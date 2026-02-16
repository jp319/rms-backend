import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { owners, properties, propertyImages, units } from "@/shared/db/schemas";

const DEFAULT_MAX_TEXT_LENGTH = 1000;
const DEFAULT_MIN_STRING_LENGTH = 2;
const DEFAULT_MIN_NUMBER_LENGTH = 4;
const DEFAULT_MAX_STRING_LENGTH = 255;
const DEFAULT_MAX_NUMBER_LENGTH = 10;

export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);

export const createPropertySchema = insertPropertySchema
  .omit({
    createdAt: true,
    id: true,
    ownerId: true,
    updatedAt: true,
  })
  .extend({
    address: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_TEXT_LENGTH),
    address2: z.string().max(DEFAULT_MAX_TEXT_LENGTH).optional(),
    city: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    country: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    name: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    propertyType: z.enum(["single-unit", "multi-unit"]),
    state: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    zipCode: z
      .string()
      .min(DEFAULT_MIN_NUMBER_LENGTH)
      .max(DEFAULT_MAX_NUMBER_LENGTH),
  });

export const updatePropertySchema = createPropertySchema.partial();

export const getPropertyWithOwnerSchema = selectPropertySchema.extend({
  owner: createSelectSchema(owners).nullable(),
});

export const getPropertyWithImagesAndOwnerSchema =
  getPropertyWithOwnerSchema.extend({
    images: z.array(createSelectSchema(propertyImages)).nullable(),
  });

export const getPropertyWithFullRelationshipSchema =
  getPropertyWithImagesAndOwnerSchema.extend({
    units: z.array(createSelectSchema(units)),
  });

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyWithOwner = z.infer<typeof getPropertyWithOwnerSchema>;
export type PropertyWithImagesAndOwner = z.infer<
  typeof getPropertyWithImagesAndOwnerSchema
>;
export type PropertyWithFullRelationship = z.infer<
  typeof getPropertyWithFullRelationshipSchema
>;
