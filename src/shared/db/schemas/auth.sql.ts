import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const DEFAULT_RATE_LIMIT_MAX = 10;
const DEFAULT_RATE_LIMIT_TIME_WINDOW = 86_400_000;
const DEFAULT_REQUEST_COUNT = 0;

export const users = pgTable("users", {
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  role: varchar({ enum: ["owner", "tenant"] }).notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    id: text("id").primaryKey(),
    ipAddress: text("ipAddress"),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updatedAt")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    accessToken: text("accessToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    accountId: text("accountId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    id: text("id").primaryKey(),
    idToken: text("idToken"),
    password: text("password"),
    providerId: text("providerId").notNull(),
    refreshToken: text("refreshToken"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    updatedAt: timestamp("updatedAt")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const apikeys = pgTable(
  "apikeys",
  {
    createdAt: timestamp("createdAt").notNull(),
    enabled: boolean("enabled").default(true),
    expiresAt: timestamp("expiresAt"),
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    lastRefillAt: timestamp("lastRefillAt"),
    lastRequest: timestamp("lastRequest"),
    metadata: text("metadata"),
    name: text("name"),
    permissions: text("permissions"),
    prefix: text("prefix"),
    rateLimitEnabled: boolean("rateLimitEnabled").default(true),
    rateLimitMax: integer("rateLimitMax").default(DEFAULT_RATE_LIMIT_MAX),
    rateLimitTimeWindow: integer("rateLimitTimeWindow").default(
      DEFAULT_RATE_LIMIT_TIME_WINDOW,
    ),
    refillAmount: integer("refillAmount"),
    refillInterval: integer("refillInterval"),
    remaining: integer("remaining"),
    requestCount: integer("requestCount").default(DEFAULT_REQUEST_COUNT),
    start: text("start"),
    updatedAt: timestamp("updatedAt").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("apikeys_key_idx").on(table.key),
    index("apikeys_userId_idx").on(table.userId),
  ],
);
