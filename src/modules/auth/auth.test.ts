import { BASE_USER, createAndLoginUser } from "tests/helpers";
import { describe, expect, it, vi } from "vitest";

import app from "@/app";

// Mock mail service
vi.mock("@/modules/mail/mail.service", () => ({
  sendEmail: vi.fn(),
}));

describe("Auth Integration", () => {
  it("should sign up a new user", async () => {
    const email = "signup-test@example.com";

    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...BASE_USER, email }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: { email, role: "owner" },
      token: null,
    });
  });

  it("should sign in and receive a session cookie", async () => {
    // This helper does the Sign-Up + Verify steps for us
    const { cookie } = await createAndLoginUser("signin-test");

    expect(cookie).toBeDefined();
    expect(cookie).toContain("better-auth.session_token");
  });

  it("should access protected route (get session)", async () => {
    // Arrange: Create a FRESH user and session just for this test
    const { cookie, email } = await createAndLoginUser("session-test");

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
    const { cookie } = await createAndLoginUser("signout-test");

    // Act
    const res = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(200);
  });

  it("should fail to access session after logout", async () => {
    // Arrange
    const { cookie } = await createAndLoginUser("logout-check");

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
