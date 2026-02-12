import { date, integer, pgTable, serial } from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { tenants } from "./tenants.sql";
import { units } from "./units.sql";

export const leases = pgTable("leases", {
  endDate: date({ mode: "date" }).notNull(),
  id: serial().primaryKey(),
  monthlyRent: integer().notNull(),
  securityDeposit: integer().notNull(),
  startDate: date({ mode: "date" }).notNull(),
  tenantId: serial()
    .notNull()
    .references(() => tenants.id),
  unitId: serial()
    .notNull()
    .references(() => units.id),
  ...timestamps,
});
