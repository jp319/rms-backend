import { eq } from "drizzle-orm";

import app from "@/app";
import env from "@/env";
import createDb from "@/shared/db";
import { users } from "@/shared/db/schemas";

// Reusable login function
export const createAndLoginUser = async (uniqueId: string) => {
  const email = `test-${uniqueId}@example.com`;
  const password = "Password123!";

  // 1. Sign Up
  await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Owner",
      role: "owner",
      email,
      password,
    }),
  });

  // 2. Verify Email (DB Hack)
  const db = createDb(env);
  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, email));

  // 3. Sign In
  const res = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const cookie = res.headers.get("set-cookie");

  if (!cookie) throw new Error("Login failed");

  return { cookie, email, userId: uniqueId }; // Return whatever you need
};

export const createAndLoginOwner = async (uniqueId: string) => {
  const { cookie, email } = await createAndLoginUser(uniqueId);

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
