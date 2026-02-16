import { eq } from "drizzle-orm";

import type {
  CreateTenantInput,
  Tenant,
  UpdateTenantInput,
} from "@/modules/tenants/tenants.schema";

import env from "@/env";
import createDb from "@/shared/db";
import { tenants } from "@/shared/db/schemas";

const db = createDb(env);

export const tenantsRepository = {
  create: async (
    ownerId: number,
    input: CreateTenantInput,
  ): Promise<Tenant | undefined> => {
    const [created] = await db
      .insert(tenants)
      .values({
        ownerId,
        ...input,
      })
      .returning();
    return created;
  },
  update: async (
    id: number,
    input: UpdateTenantInput,
  ): Promise<Tenant | undefined> => {
    const [updated] = await db
      .update(tenants)
      .set({
        ...input,
      })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  },
  findByIdAndOwnerId: async (
    id: number,
    ownerId: number,
  ): Promise<Tenant | undefined> => {
    return await db.query.tenants.findFirst({
      where: {
        id,
        ownerId,
      },
    });
  },
  findByOwnerId: async (ownerId: number): Promise<Tenant[]> => {
    return await db.query.tenants.findMany({
      where: {
        ownerId,
      },
    });
  },
};
