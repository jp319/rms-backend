import { eq } from "drizzle-orm";

import type {
  CreateLeaseInput,
  Lease,
  UpdateLeaseInput,
} from "@/modules/leases/leases.schema";

import env from "@/env";
import createDb from "@/shared/db";
import { leases } from "@/shared/db/schemas";

const db = createDb(env);

export const leasesRepository = {
  create: async (
    unitId: number,
    input: CreateLeaseInput,
  ): Promise<Lease | undefined> => {
    const [created] = await db
      .insert(leases)
      .values({
        unitId,
        ...input,
      })
      .returning();

    return created;
  },
  update: async (
    id: number,
    input: UpdateLeaseInput,
  ): Promise<Lease | undefined> => {
    const [updated] = await db
      .update(leases)
      .set(input)
      .where(eq(leases.id, id))
      .returning();

    return updated;
  },
  findByIdAndOwnerId: async (
    id: number,
    ownerId: number,
  ): Promise<Lease | undefined> => {
    return await db.query.leases.findFirst({
      where: {
        id,
        unit: {
          property: {
            ownerId,
          },
        },
      },
    });
  },
  findByOwnerId: async (ownerId: number): Promise<Lease[] | undefined> => {
    return await db.query.leases.findMany({
      where: {
        unit: {
          property: {
            ownerId,
          },
        },
      },
    });
  },
  findByOwnerAndTenantId: async (
    ownerId: number,
    tenantId: number,
  ): Promise<Lease[]> => {
    return await db.query.leases.findMany({
      where: {
        tenantId,
        unit: {
          property: {
            ownerId,
          },
        },
      },
    });
  },
};
