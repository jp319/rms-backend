import { eq } from "drizzle-orm";

import app from "@/app";
import env from "@/env";
import createDb from "@/shared/db";
import { users } from "@/shared/db/schemas";

// CONSTANTS
export const BASE_USER = {
  password: "Password123!",
  name: "Test User",
  role: "owner" as const,
};

// AUTH
export const createAndLoginUser = async (
  uniqueId: string,
  role: "owner" | "tenant" = "owner",
) => {
  const email = `test-${uniqueId}@example.com`;
  const password = "Password123!";

  // Sign Up
  await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Owner",
      role,
      email,
      password,
    }),
  });

  // Auto Verify Email
  const db = createDb(env);
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, email));

  // Sign In
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const cookie = res.headers.get("set-cookie");

  if (!cookie) throw new Error("Login failed");

  return { cookie, email, userId: uniqueId };
};

export const createAndLoginOwner = async (uniqueId: string) => {
  const { cookie, email } = await createAndLoginUser(uniqueId, "owner");

  const db = createDb(env);

  const user = await db.query.users.findFirst({
    where: {
      email,
    },
  });

  if (!user) throw new Error("User not found for test email");

  const owner = await db.query.owners.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!owner) throw new Error("Owner not found for test user");

  return { cookie, email, user, owner };
};

// FACTORIES
export const generateProperty = (overrides = {}) => ({
  name: "Test Property",
  address: "123 Test St",
  city: "Davao City",
  country: "Philippines",
  state: "Davao del Sur",
  zipCode: "8000",
  propertyType: "single-unit" as const,
  ...overrides,
});

export const generateUnit = (overrides = {}) => ({
  unitNumber: 1,
  monthlyRent: 1000,
  ...overrides,
});

export const generateTenant = (overrides = {}) => ({
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
  ...overrides,
});

export const generateLease = (overrides = {}) => ({
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 Year
  monthlyRent: 1000,
  securityDeposit: 1000,
  ...overrides,
});
