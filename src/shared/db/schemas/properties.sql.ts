import {
  index,
  integer,
  pgTable,
  serial,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { owners } from "./owners.sql";

export const properties = pgTable(
  "properties",
  {
    address: text().notNull(),
    address2: text(),
    city: varchar().notNull(),
    country: varchar().notNull(),
    id: serial().primaryKey(),
    name: varchar().notNull(),
    ownerId: integer()
      .notNull()
      .references(() => owners.id),
    propertyType: varchar({ enum: ["single-unit", "multi-unit"] }).notNull(),
    state: varchar().notNull(),
    zipCode: varchar().notNull(),
    ...timestamps,
  },
  (tb) => [
    unique("unique_property_address").on(
      tb.city,
      tb.state,
      tb.zipCode,
      tb.country,
    ),
    index("property_owner_idx").on(tb.ownerId),
    index("property_city_idx").on(tb.city),
    index("property_type_idx").on(tb.propertyType),
  ],
);
