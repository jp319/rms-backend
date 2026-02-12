import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

import app from "@/app";
import env from "@/env";
import createDb from "@/shared/db";
import { users } from "@/shared/db/schemas";

// Mock mail service
vi.mock("@/modules/mail/mail.service", () => ({
  sendEmail: vi.fn(),
}));

describe("Auth Integration", () => {
  // Use a unique email for each test OR ensure DB reset in beforeEach
  // Here we use a helper to keep tests clean.
  const baseUser = {
    password: "Password123!",
    name: "Test Owner",
    role: "owner",
  };

  /**
   * Helper: Creates a user, verifies email, and logs them in.
   * Returns the session cookie and the user email used.
   */
  const createAndLoginUser = async (customEmail?: string) => {
    const email = customEmail || `test-${Date.now()}@example.com`;

    // 1. Sign Up
    await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseUser, email }),
    });

    // 2. Manual Verify (DB)
    const db = createDb(env);
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));

    // 3. Sign In
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: baseUser.password }),
    });

    const cookie = res.headers.get("set-cookie");
    if (!cookie) throw new Error("Login failed, no cookie returned");

    return { cookie, email };
  };

  it("should sign up a new user", async () => {
    const email = "signup-test@example.com";

    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseUser, email }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: { email, role: "owner" },
      token: null,
    });
  });

  it("should sign in and receive a session cookie", async () => {
    // This helper does the Sign-Up + Verify steps for us
    const { cookie } = await createAndLoginUser("signin-test@example.com");

    expect(cookie).toBeDefined();
    expect(cookie).toContain("better-auth.session_token");
  });

  it("should access protected route (get session)", async () => {
    // Arrange: Create a FRESH user and session just for this test
    const { cookie, email } = await createAndLoginUser(
      "session-test@example.com",
    );

    // Act: Access protected route
    const res = await app.request("/api/auth/get-session", {
      headers: { Cookie: cookie },
    });

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    // @ts-ignore
    expect(body.session).toBeDefined();
    // @ts-ignore
    expect(body.user.email).toBe(email);
  });

  it("should sign out", async () => {
    // Arrange
    const { cookie } = await createAndLoginUser("signout-test@example.com");

    // Act
    const res = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(200);
  });

  it("should fail to access session after logout", async () => {
    // Arrange
    const { cookie } = await createAndLoginUser("logout-check@example.com");

    // Act 1: Logout
    await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    // Act 2: Try to get session again
    const res = await app.request("/api/auth/get-session", {
      headers: { Cookie: cookie },
    });

    // Assert
    const body = await res.json();
    expect(body).toBe(null); // Session should be null
  });
});
