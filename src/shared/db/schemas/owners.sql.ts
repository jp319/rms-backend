import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { users } from "./auth.sql";
import { timestamps } from "./columns.helpers";

export const owners = pgTable("owners", {
  id: serial().primaryKey(),
  userId: varchar()
    .notNull()
    .references(() => users.id),
  ...timestamps,
});
