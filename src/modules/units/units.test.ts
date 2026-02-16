import { testClient } from "hono/testing";
import { StatusCodes } from "http-status-toolkit";
import { createAndLoginOwner } from "tests/helpers";
import { describe, expect, it, vi } from "vitest";

import type { AppType } from "@/modules/units/units.routes";

import env from "@/env";
import unitsRoutes from "@/modules/units/units.routes";
import { createTestApp } from "@/shared/create-app";
import createDb from "@/shared/db";
import { leases, properties, tenants, units } from "@/shared/db/schemas";

vi.mock("@/modules/mail/mail.service", () => ({ sendEmail: vi.fn() }));

describe("Properties Integration", () => {
  const client = testClient<AppType>(createTestApp(unitsRoutes));

  // Factory
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

  const generateUnit = (overrides = {}) => ({
    unitNumber: 1,
    monthlyRent: 1000,
    ...overrides,
  });

  const generateTenant = (overrides = {}) => ({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "1234567890",
    ...overrides,
  });

  const generateLease = (overrides = {}) => ({
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    monthlyRent: 1000,
    securityDeposit: 1000,
    tenantId: 1,
    ...overrides,
  });

  it("should list units for the logged-in owner", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

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

    const res = await client.api.owners.units.$get(
      {},
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

  it("should update a unit (PATCH)", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-update");

    const db = createDb(env);

    const [property] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    if (!property) throw new Error("Property not created for test user");

    const [unit] = await db
      .insert(units)
      .values({
        ...generateUnit({ unitNumber: 101 }),
        propertyId: property.id,
      })
      .returning();

    if (!unit) throw new Error("Unit not created for test user");

    const updateRes = await client.api.owners.units[":id"].$patch(
      {
        param: { id: unit.id.toString() },
        json: {
          unitNumber: 111,
          monthlyRent: 23123,
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(updateRes.status).toBe(StatusCodes.OK);

    if (updateRes.status === StatusCodes.OK) {
      const { data: updatedProp } = await updateRes.json();

      expect(updatedProp.unitNumber).toBe(111);
      expect(updatedProp.monthlyRent).toBe(23123);
    }
  });

  it("should find all leases by unit id and owner id", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-update");

    const db = createDb(env);

    const [property] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    if (!property) throw new Error("Property not created for test user");

    const [tenant] = await db
      .insert(tenants)
      .values({
        ...generateTenant({ name: "John Doe" }),
        ownerId: owner.id,
      })
      .returning();

    if (!tenant) throw new Error("Tenant not created for test user");

    const [unit] = await db
      .insert(units)
      .values({
        ...generateUnit({ unitNumber: 101 }),
        propertyId: property.id,
      })
      .returning();

    if (!unit) throw new Error("Unit not created for test user");

    const [lease] = await db
      .insert(leases)
      .values({
        ...generateLease({
          startDate: new Date(),
          endDate: new Date(),
          tenantId: tenant.id,
        }),
        unitId: unit.id,
      })
      .returning();

    if (!lease) throw new Error("Lease not created for test user");

    const res = await client.api.owners.units[":id"].leases.$get(
      {
        param: {
          id: unit.id.toString(),
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
  });

  it("should create a new lease on a unit", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-update");

    const db = createDb(env);

    const [property] = await db
      .insert(properties)
      .values({
        ...generateProperty({ name: "Sunset Villas" }),
        ownerId: owner.id,
      })
      .returning();

    if (!property) throw new Error("Property not created for test user");

    const [tenant] = await db
      .insert(tenants)
      .values({
        ...generateTenant({ name: "John Doe" }),
        ownerId: owner.id,
      })
      .returning();

    if (!tenant) throw new Error("Tenant not created for test user");

    const [unit] = await db
      .insert(units)
      .values({
        ...generateUnit({ unitNumber: 101 }),
        propertyId: property.id,
      })
      .returning();

    if (!unit) throw new Error("Unit not created for test user");

    const generated = generateLease({ tenantId: tenant.id });

    const res = await client.api.owners.units[":id"].leases.$post(
      {
        param: {
          id: unit.id.toString(),
        },
        json: {
          ...generated,
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
    if (res.status === StatusCodes.OK) {
      const { data } = await res.json();
      expect(data).toStrictEqual({
        ...generated,
        id: expect.any(Number),
        startDate: expect.any(String),
        endDate: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        unitId: unit.id,
      });
    }
  });

  it("should get a single unit details by ID", async () => {
    const { cookie, owner } = await createAndLoginOwner("unit-get-one");
    const db = createDb(env);

    // Setup: Create Property & Unit
    const [property] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();

    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit({ unitNumber: 505 }), propertyId: property.id })
      .returning();

    // Act
    const res = await client.api.owners.units[":id"].$get(
      { param: { id: unit.id.toString() } },
      { headers: { Cookie: cookie } },
    );

    // Assert
    expect(res.status).toBe(StatusCodes.OK);
    const body = await res.json();
    expect(body.data).toMatchObject({
      id: unit.id,
      unitNumber: 505,
    });
  });

  it("should return 404 when getting a non-existent unit", async () => {
    const { cookie } = await createAndLoginOwner("unit-404");

    const res = await client.api.owners.units[":id"].$get(
      { param: { id: "99999" } },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });
});
