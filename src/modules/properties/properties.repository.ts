import { and, eq } from "drizzle-orm";

import env from "@/env";
import {
  type CreatePropertyInput,
  type Property,
  type PropertyWithFullRelationship,
  type PropertyWithImagesAndOwner,
  type UpdatePropertyInput,
} from "@/modules/properties/properties.schema";
import createDb from "@/shared/db";
import { properties } from "@/shared/db/schemas";

const db = createDb(env);

export const propertiesRepository = {
  create: async (
    ownerId: number,
    input: CreatePropertyInput,
  ): Promise<Property | undefined> => {
    const [created] = await db
      .insert(properties)
      .values({
        ...input,
        ownerId,
      })
      .returning();

    return created;
  },
  update: async (
    id: number,
    ownerId: number,
    input: UpdatePropertyInput,
  ): Promise<Property | undefined> => {
    const [updated] = await db
      .update(properties)
      .set(input)
      .where(and(eq(properties.id, id), eq(properties.ownerId, ownerId)))
      .returning();

    return updated;
  },
  findById: async (
    id: number,
  ): Promise<PropertyWithImagesAndOwner | undefined> => {
    return await db.query.properties.findFirst({
      where: {
        id,
      },
      with: {
        images: true,
        owner: true,
      },
    });
  },
  findAll: async (): Promise<Property[]> => {
    return await db.query.properties.findMany();
  },
  checkOwner: async (
    id: number,
    ownerId: number,
  ): Promise<Property | undefined> => {
    return await db.query.properties.findFirst({
      where: {
        id,
        ownerId,
      },
    });
  },
  findByOwnerId: async (
    ownerId: number,
  ): Promise<PropertyWithFullRelationship[]> => {
    return await db.query.properties.findMany({
      where: {
        ownerId,
      },
      with: {
        images: true,
        owner: true,
        units: true,
      },
    });
  },
};
