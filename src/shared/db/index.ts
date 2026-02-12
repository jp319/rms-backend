import { drizzle } from "drizzle-orm/node-postgres";

import type { Environment } from "@/env";

import { relations } from "@/shared/db/relations";
import * as schema from "@/shared/db/schemas";

const createDb = (env: Environment) => {
  return drizzle({
    casing: "snake_case",
    connection: env.DATABASE_URL,
    relations: relations,
    schema,
  });
};

export default createDb;
