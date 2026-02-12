import { integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { owners } from "./owners.sql";

export const tenants = pgTable(
  "tenants",
  {
    email: text().notNull(),
    id: serial().primaryKey(),
    name: text().notNull(),
    ownerId: integer()
      .notNull()
      .references(() => owners.id),
    phone: text().notNull(),
    ...timestamps,
  },
  (tb) => [
    unique("unique_tenant_record").on(tb.email, tb.name, tb.phone, tb.ownerId),
  ],
);
