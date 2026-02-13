import type { CreateUnitInput, Unit } from "@/modules/units/units.schema";

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
  findByPropertyId: async (propertyId: number): Promise<Unit[]> => {
    return await db.query.units.findMany({
      where: {
        propertyId,
      },
    });
  },
};
