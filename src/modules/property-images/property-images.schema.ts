import { z } from "@hono/zod-openapi";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { propertyImages } from "@/shared/db/schemas";

const DEFAULT_MIN_STRING_LENGTH = 2;
const DEFAULT_MAX_TEXT_LENGTH = 1000;
const DEFAULT_MAX_STRING_LENGTH = 255;
const MINIMUM_IMAGE_NUMBER = 1;
const MAXIMUM_IMAGE_NUMBER = 5;

export const getUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|png|webp)$/, "Only images allowed"),
});

export const insertPropertyImageSchema = createInsertSchema(propertyImages);
export const selectPropertyImageSchema = createSelectSchema(propertyImages);

export const createPropertyImageSchema = insertPropertyImageSchema
  .omit({
    createdAt: true,
    id: true,
    propertyId: true,
    updatedAt: true,
  })
  .extend({
    name: z
      .string()
      .min(DEFAULT_MIN_STRING_LENGTH)
      .max(DEFAULT_MAX_STRING_LENGTH),
    url: z.string().min(1).max(DEFAULT_MAX_TEXT_LENGTH),
  });

export const creatMultiplePropertyImageSchema = z
  .array(createPropertyImageSchema)
  .min(MINIMUM_IMAGE_NUMBER)
  .max(MAXIMUM_IMAGE_NUMBER);

export type PropertyImage = typeof propertyImages.$inferSelect;
export type CreatePropertyImageInput = z.infer<
  typeof createPropertyImageSchema
>;
export type CreateMultiplePropertyImageInput = z.infer<
  typeof creatMultiplePropertyImageSchema
>;
