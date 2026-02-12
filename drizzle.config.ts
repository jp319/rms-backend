import { defineConfig } from "drizzle-kit";

import env from "@/env";

export default defineConfig({
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  dialect: "postgresql",
  migrations: {
    schema: "public",
    table: "_drizzle_migrations",
  },
  out: "./src/shared/db/migrations",
  schema: "./src/shared/db/schemas/index.ts",
});
