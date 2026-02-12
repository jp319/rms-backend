import { integer, pgTable, serial, unique } from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { properties } from "./properties.sql";

export const units = pgTable(
  "units",
  {
    id: serial().primaryKey(),
    monthlyRent: integer().notNull(),
    propertyId: integer()
      .notNull()
      .references(() => properties.id),
    unitNumber: integer().notNull(),
    ...timestamps,
  },
  (tb) => [
    unique("unique_property_unit_number").on(tb.propertyId, tb.unitNumber),
  ],
);
