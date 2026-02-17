import { eq } from "drizzle-orm";

import type {
  CreateMultiplePropertyImageInput,
  CreatePropertyImageInput,
  PropertyImage,
} from "@/modules/property-images/property-images.schema";

import env from "@/env";
import createDb from "@/shared/db";
import { propertyImages } from "@/shared/db/schemas";

const db = createDb(env);

export const propertyImagesRepository = {
  create: async (propertyId: number, input: CreatePropertyImageInput) => {
    const [created] = await db
      .insert(propertyImages)
      .values({ propertyId, ...input })
      .returning();

    return created;
  },
  findByPropertyId: async (propertyId: number) => {
    return await db.query.propertyImages.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  findById: async (id: number) => {
    return await db.query.propertyImages.findFirst({
      where: {
        id,
      },
    });
  },
  createMultiplePropertyImage: async (
    propertyId: number,
    input: CreateMultiplePropertyImageInput,
  ): Promise<PropertyImage[]> => {
    const formatted = input.map((image) => ({ propertyId, ...image }));
    return db.insert(propertyImages).values(formatted).returning();
  },
  delete: async (imageId: number): Promise<PropertyImage | undefined> => {
    const [deleted] = await db
      .delete(propertyImages)
      .where(eq(propertyImages.id, imageId))
      .returning();

    return deleted;
  },
};
