import { eq } from "drizzle-orm";

import type {
  CreateUnitInput,
  Unit,
  UpdateUnitInput,
} from "@/modules/units/units.schema";

import env from "@/env";
import createDb from "@/shared/db";
import { units } from "@/shared/db/schemas";

const db = createDb(env);

export const unitsRepository = {
  create: async (
    propertyId: number,
    input: CreateUnitInput,
  ): Promise<Unit | undefined> => {
    const [created] = await db
      .insert(units)
      .values({ ...input, propertyId })
      .returning();

    return created;
  },
  update: async (
    id: number,
    input: UpdateUnitInput,
  ): Promise<Unit | undefined> => {
    const [updated] = await db
      .update(units)
      .set(input)
      .where(eq(units.id, id))
      .returning();

    return updated;
  },
  findByIdAndOwnerId: async (
    id: number,
    ownerId: number,
  ): Promise<Unit | undefined> => {
    return await db.query.units.findFirst({
      where: {
        id,
        property: {
          ownerId,
        },
      },
    });
  },
  findByPropertyId: async (propertyId: number): Promise<Unit[]> => {
    return await db.query.units.findMany({
      where: {
        propertyId,
      },
    });
  },
  findByOwnerId: async (ownerId: number): Promise<Unit[]> => {
    return await db.query.units.findMany({
      where: {
        property: {
          ownerId,
        },
      },
    });
  },
  async hasActiveLease(unitId: number): Promise<boolean> {
    const today = new Date();

    const activeLease = await db.query.leases.findFirst({
      where: {
        unitId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    return !!activeLease;
  },
  async isAvailable(unitId: number): Promise<boolean> {
    const today = new Date();

    const existingLease = await db.query.leases.findFirst({
      where: {
        unitId,
        endDate: { gte: today },
      },
    });

    return !existingLease;
  },
};
