import { eq } from "drizzle-orm";
import { testClient } from "hono/testing";
import { StatusCodes } from "http-status-toolkit";
import {
  createAndLoginOwner,
  createAndLoginUser,
  generateProperty,
  generateUnit,
} from "tests/helpers";
import { describe, expect, it, vi } from "vitest";

import type { AppType } from "@/modules/properties/properties.routes";

import env from "@/env";
import propertyRoutes from "@/modules/properties/properties.routes";
import { createTestApp } from "@/shared/create-app";
import createDb from "@/shared/db";
import { properties, units } from "@/shared/db/schemas";

vi.mock("@/modules/mail/mail.service", () => ({ sendEmail: vi.fn() }));

describe("Properties Integration", () => {
  const client = testClient<AppType>(createTestApp(propertyRoutes));

  it("should create a property when authenticated", async () => {
    const { cookie } = await createAndLoginUser("prop-create");

    const res = await client.api.owners.properties.$post(
      { json: generateProperty({ name: "Sunset Villas" }) },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
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

    expect(res.status).toBe(StatusCodes.OK);
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

    expect(updateRes.status).toBe(StatusCodes.OK);

    if (updateRes.status === StatusCodes.OK) {
      const { data: updatedProp } = await updateRes.json();

      expect(updatedProp.name).toBe("Updated Name");
      expect(updatedProp.propertyType).toBe("multi-unit");
    }
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

  it("should list property units for the logged-in owner", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-units");

    const db = createDb(env);

    const [property] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    const inserts = [];

    for (let i = 0; i < 3; i++) {
      inserts.push({
        ...generateUnit({ unitNumber: i }),
        propertyId: property.id,
      });
    }

    await db.insert(units).values(inserts);

    const res = await client.api.owners.properties[":id"].units.$get(
      {
        param: { id: property.id.toString() },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
    const { data } = await res.json();

    expect(data).toHaveLength(3);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ unitNumber: 0 }),
        expect.objectContaining({ unitNumber: 1 }),
        expect.objectContaining({ unitNumber: 2 }),
      ]),
    );
  });

  it("should create a property unit when authenticated", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

    const db = createDb(env);

    const [property] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    const res = await client.api.owners.properties[":id"].units.$post(
      {
        param: { id: property.id.toString() },
        json: generateUnit({ unitNumber: 101, monthlyRent: 1500 }),
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body.data).toMatchObject({
      unitNumber: 101,
    });
  });

  it("should NOT allow an owner to update another owner's property", async () => {
    // 1. Setup: Create Owner A and Owner B
    const ownerA = await createAndLoginOwner("owner-a");
    const ownerB = await createAndLoginOwner("owner-b");

    const db = createDb(env);

    // 2. Owner A creates a property
    const [propertyA] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Owner A's Villa" }),
        ownerId: ownerA.owner.id,
      })
      .returning();

    // 3. Act: Owner B tries to update Owner A's property
    const res = await client.api.owners.properties[":id"].$patch(
      {
        param: { id: propertyA.id.toString() },
        json: { name: "HACKED NAME" },
      },
      { headers: { Cookie: ownerB.cookie } }, // 👈 Using Owner B's cookie
    );

    // 4. Assert: Should be 404 (Not Found) or 403 (Forbidden)
    // 404 is often better for security so attackers can't "fish" for IDs
    expect(res.status).toBe(StatusCodes.NOT_FOUND);

    // Double Check: Ensure the name didn't actually change in the DB
    const [unchangedProp] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyA.id));
    expect(unchangedProp.name).toBe("Owner A's Villa");
  });

  it("should return 422 Unprocessable Entity when sending an empty update", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-empty-update");
    const db = createDb(env);

    const [created] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();

    const res = await client.api.owners.properties[":id"].$patch(
      {
        param: { id: created.id.toString() },
        json: {}, // 👈 Sending empty object
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    if (res.status === StatusCodes.UNPROCESSABLE_ENTITY) {
      // @ts-ignore - Intentionally sending wrong types to test Zod
      const { success, error } = await res.json();
      expect(success).toBe(false);
      expect(error.issues[0].message).toBeDefined();
    }
  });

  it("should return 400 Bad Request for invalid data types", async () => {
    const { cookie } = await createAndLoginUser("prop-invalid");

    const res = await client.api.owners.properties.$post(
      {
        // @ts-ignore - Intentionally sending wrong types to test Zod
        json: generateProperty({
          zipCode: 12345, // Schema likely expects String, sending Number
          propertyType: "space-station", // Invalid Enum value
        }),
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.BAD_REQUEST); // or 422 depending on config
  });
});
