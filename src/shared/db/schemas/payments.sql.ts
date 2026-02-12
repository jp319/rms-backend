import {
  date,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./columns.helpers";
import { leases } from "./leases.sql";

export const payments = pgTable("payments", {
  amount: integer().notNull(),
  datePaid: date().notNull(),
  id: serial().primaryKey(),
  leaseId: integer()
    .notNull()
    .references(() => leases.id),
  notes: text(),
  paymentType: varchar({ enum: ["damages", "deposit", "rent"] }).notNull(),
  receiptUrl: text(),
  ...timestamps,
});
