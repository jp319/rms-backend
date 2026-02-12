import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { properties } from "./properties.sql";

export const propertyImages = pgTable("property_images", {
  id: serial().primaryKey(),
  name: varchar().notNull(),
  propertyId: integer()
    .notNull()
    .references(() => properties.id),
  url: text().notNull(),
  ...timestamps,
});
