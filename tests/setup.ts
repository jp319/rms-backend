import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api-postgres";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { relations } from "@/shared/db/relations";
import * as schema from "@/shared/db/schemas";

// 1. Singleton Instance
const client = new PGlite();
const db = drizzle({ client, relations, schema, casing: "snake_case" });
const migrator = drizzle({ client, relations, casing: "snake_case" });

vi.mock("@/shared/db/index", () => ({ default: vi.fn(() => db) }));

beforeAll(async () => {
  const { apply } = await pushSchema(schema, migrator, "snake_case");
  await apply();
});

// 2. ROBUST CLEANUP: Ask Postgres for tables instead of guessing from JS objects
afterEach(async () => {
  // Get all table names in the 'public' schema
  const query = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );

  const tables = query.rows.map((row) => `"${row.tablename}"`);

  if (tables.length > 0) {
    // Truncate all tables found
    await db.execute(sql.raw(`TRUNCATE TABLE ${tables.join(", ")} CASCADE;`));
  }
});

afterAll(async () => {
  await client.close();
});
