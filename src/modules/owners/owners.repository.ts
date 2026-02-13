import type { User } from "better-auth";

import env from "@/env";
import createDb from "@/shared/db";
import { owners } from "@/shared/db/schemas";

const db = createDb(env);

const ownersRepository = {
  create: async (user: User): Promise<NewOwner | undefined> => {
    const [created] = await db
      .insert(owners)
      .values({ userId: user.id })
      .returning();
    return created;
  },
  findByUserId: async (userId: string): Promise<Owner | undefined> => {
    return await db.query.owners.findFirst({
      where: {
        userId,
      },
    });
  },
};

export type NewOwner = typeof owners.$inferInsert;
export type Owner = typeof owners.$inferSelect;

export default ownersRepository;
