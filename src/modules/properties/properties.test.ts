import { testClient } from "hono/testing";
import { createAndLoginOwner, createAndLoginUser } from "tests/helpers";
import { describe, expect, it, vi } from "vitest";

import type { AppType } from "@/app";

import env from "@/env";
import propertyRoutes from "@/modules/properties/property.routes";
import { createTestApp } from "@/shared/create-app";
import createDb from "@/shared/db";
import { properties } from "@/shared/db/schemas";

vi.mock("@/modules/mail/mail.service", () => ({ sendEmail: vi.fn() }));

describe("Properties Integration", () => {
  const client = testClient<AppType>(createTestApp(propertyRoutes));

  // 🏭 FACTORY
  const generateProperty = (overrides = {}) => ({
    name: "Test Property",
    address: "123 Test St",
    city: "Davao City",
    country: "Philippines",
    state: "Davao del Sur",
    zipCode: "8000",
    propertyType: "single-unit" as const,
    ...overrides,
  });

  it("should create a property when authenticated", async () => {
    const { cookie } = await createAndLoginUser("prop-create");

    const res = await client.api.owners.properties.$post(
      { json: generateProperty({ name: "Sunset Villas" }) },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      name: "Sunset Villas",
    });
  });

  it("should list properties for the logged-in owner", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-list");

    const db = createDb(env);

    const inserts = [];

    for (let i = 0; i < 3; i++) {
      inserts.push({
        ...generateProperty({
          name: `Prop ${i}`,
          address: `Address ${i}`,
          city: `City ${i}`,
          country: `Country ${i}`,
          state: `State ${i}`,
          zipCode: `Zip ${i}`,
        }),
        ownerId: owner.id,
      });
    }

    await db.insert(properties).values(inserts);

    const res = await client.api.owners.properties.$get(
      {},
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.data).toHaveLength(3);
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Prop 0" }),
        expect.objectContaining({ name: "Prop 1" }),
        expect.objectContaining({ name: "Prop 2" }),
      ]),
    );
  });

  it("should update a property (PATCH)", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-list");

    const db = createDb(env);

    const [created] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    if (!created) throw new Error("Property not created for test user");

    const updateRes = await client.api.owners.properties[":id"].$patch(
      {
        param: { id: created.id.toString() },
        json: {
          name: "Updated Name",
          propertyType: "multi-unit",
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(updateRes.status).toBe(200);
    const { data: updatedProp } = await updateRes.json();

    expect(updatedProp.name).toBe("Updated Name");
    expect(updatedProp.propertyType).toBe("multi-unit");
  });

  it("should return 404 for missing property", async () => {
    const { cookie } = await createAndLoginUser("prop-404");

    const res = await client.api.owners.properties[":id"].$get(
      { param: { id: "9999" } },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(404);
  });

  it("should return 404 for updating a missing property (PATCH)", async () => {
    const { cookie } = await createAndLoginOwner("prop-list");

    const updateRes = await client.api.owners.properties[":id"].$patch(
      {
        param: { id: "9999" },
        json: {
          name: "Updated Name",
          propertyType: "multi-unit",
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(updateRes.status).toBe(404);
  });
});
