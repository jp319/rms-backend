import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";

import type { AppType } from "@/app";

import indexRoute from "@/routes/index.route";
import { createTestApp } from "@/shared/create-app";

describe("Index endpoint", () => {
  const client = testClient<AppType>(createTestApp(indexRoute));

  it("should return a message", async () => {
    const res = await client.index.$get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "RMS API",
    });
  });
});
