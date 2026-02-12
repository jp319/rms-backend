import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api-postgres";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, vi } from "vitest";

import { relations } from "@/shared/db/relations";
import * as schema from "@/shared/db/schemas";

let client = new PGlite();

vi.mock("@/shared/db/index", () => {
  const db = drizzle({
    client,
    relations,
    schema,
    casing: "snake_case",
  });

  return {
    default: vi.fn(() => db),
  };
});

beforeAll(async () => {
  const migrator = drizzle({
    client,
    relations,
    casing: "snake_case",
  });

  const { apply } = await pushSchema(schema, migrator, "snake_case");
  await apply();
});
