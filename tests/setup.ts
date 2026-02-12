import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api-postgres";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, vi } from "vitest";

import { relations } from "@/shared/db/relations";
import * as schema from "@/shared/db/schemas";

const client = new PGlite();

const db = drizzle({
  client,
  relations,
  schema,
  casing: "snake_case",
});

const migrator = drizzle({
  client,
  relations,
  casing: "snake_case",
});

beforeAll(async () => {
  const { apply } = await pushSchema(schema, migrator);
  await apply();
});

vi.mock("@/shared/db/index", () => {
  return {
    default: vi.fn(() => db),
  };
});
