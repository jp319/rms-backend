import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";

import type { AppType } from "@/app";

import indexRoutes from "@/modules/index.routes";
import { createTestApp } from "@/shared/create-app";

describe("Index endpoint", () => {
  const client = testClient<AppType>(createTestApp(indexRoutes));

  it("should return a message", async () => {
    const res = await client.index.$get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "Welcome to RMS API",
    });
  });
});
