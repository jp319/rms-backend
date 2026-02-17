import { testClient } from "hono/testing";
import { StatusCodes } from "http-status-toolkit";
import {
  createAndLoginOwner,
  generateLease,
  generateProperty,
  generateTenant,
  generateUnit,
} from "tests/helpers";
import { describe, expect, it, vi } from "vitest";

import type { AppType } from "@/modules/leases/leases.routes";

import env from "@/env";
import leasesRoutes from "@/modules/leases/leases.routes";
import { createTestApp } from "@/shared/create-app";
import createDb from "@/shared/db";
import { leases, properties, tenants, units } from "@/shared/db/schemas";

vi.mock("@/modules/mail/mail.service", () => ({ sendEmail: vi.fn() }));

describe("Tenants Integration", () => {
  const client = testClient<AppType>(createTestApp(leasesRoutes));

  it("should list all leases when authenticated", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

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

    const res = await client.api.owners.leases.$get(
      {},
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);
  });

  // Validation: Date Logic (The test you had a placeholder for)
  it("should fail validation if endDate is before startDate", async () => {
    const { cookie, owner } = await createAndLoginOwner("lease-date-fail");

    const db = createDb(env);

    // Setup: Create a Lease first
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({ ...generateLease(), unitId: unit.id, tenantId: tenant.id })
      .returning();

    // Act: Try to set endDate before startDate
    const res = await client.api.owners.leases[":id"].$patch(
      {
        param: { id: lease.id.toString() },
        json: {
          startDate: "2025-01-01",
          endDate: "2024-01-01", // ❌ Invalid: Before start date
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);

    if (res.status === StatusCodes.UNPROCESSABLE_ENTITY) {
      const body = await res.json();
      // Verify the error is specifically about the date order
      expect(body.error.issues[0].message).toMatch(
        /End date must be after start date/i,
      );
    }
  });

  // Validation: "All or Nothing" Rule
  it("should fail if providing only startDate without endDate (All-or-Nothing)", async () => {
    const { cookie, owner } = await createAndLoginOwner("lease-partial-date");

    const db = createDb(env);

    // Setup
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({ ...generateLease(), unitId: unit.id, tenantId: tenant.id })
      .returning();

    // Act: Send ONLY startDate
    const res = await client.api.owners.leases[":id"].$patch(
      {
        param: { id: lease.id.toString() },
        json: {
          startDate: "2025-06-01",
          // endDate is missing!
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);

    if (res.status === StatusCodes.UNPROCESSABLE_ENTITY) {
      const body = await res.json();
      expect(body.error.issues[0].message).toMatch(
        /Start Date and End Date must be provided together/i,
      );
    }
  });

  // Security: Ownership Isolation
  it("should NOT allow an owner to access/update another owner's lease", async () => {
    const ownerA = await createAndLoginOwner("lease-owner-a");
    const ownerB = await createAndLoginOwner("lease-owner-b"); // 🕵️ The Attacker

    const db = createDb(env);

    // Setup: Owner A creates a lease
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: ownerA.owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: ownerA.owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({ ...generateLease(), unitId: unit.id, tenantId: tenant.id })
      .returning();

    // Act: Owner B tries to update Owner A's lease
    const res = await client.api.owners.leases[":id"].$patch(
      {
        param: { id: lease.id.toString() },
        json: { monthlyRent: 999999 },
      },
      { headers: { Cookie: ownerB.cookie } }, // 👈 Using B's cookie
    );

    // Assert: Should be 404 (Not Found) to hide existence
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  // Feature: Get One
  it("should get lease details by ID", async () => {
    const { cookie, owner } = await createAndLoginOwner("lease-get");

    const db = createDb(env);

    // Setup
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({
        ...generateLease({ monthlyRent: 1500 }),
        unitId: unit.id,
        tenantId: tenant.id,
      })
      .returning();

    // Act
    const res = await client.api.owners.leases[":id"].$get(
      { param: { id: lease.id.toString() } },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);

    if (res.status === StatusCodes.OK) {
      const body = await res.json();
      expect(body.data.monthlyRent).toBe(1500);
    }
  });

  it("should add a payment to an owned lease", async () => {
    const { cookie, owner } = await createAndLoginOwner("payment-success");

    const db = createDb(env);

    // Setup Lease
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({ ...generateLease(), unitId: unit.id, tenantId: tenant.id })
      .returning();

    // Act
    const res = await client.api.owners.leases[":id"].payments.$post(
      {
        param: { id: lease.id.toString() },
        json: {
          amount: 1000,
          datePaid: "2026-02-18",
          paymentType: "rent",
          notes: "First month",
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.CREATED);

    if (res.status === StatusCodes.CREATED) {
      const body = await res.json();
      expect(body.data.amount).toBe(1000);
    }
  });

  it("should NOT allow adding payment to someone else's lease", async () => {
    const ownerA = await createAndLoginOwner("pay-owner-a");
    const ownerB = await createAndLoginOwner("pay-owner-b"); // Attacker

    const db = createDb(env);

    // Owner A's Lease
    const [prop] = await db
      .insert(properties)
      .values({ ...generateProperty(), ownerId: ownerA.owner.id })
      .returning();
    const [unit] = await db
      .insert(units)
      .values({ ...generateUnit(), propertyId: prop.id })
      .returning();
    const [tenant] = await db
      .insert(tenants)
      .values({ ...generateTenant(), ownerId: ownerA.owner.id })
      .returning();
    const [lease] = await db
      .insert(leases)
      .values({ ...generateLease(), unitId: unit.id, tenantId: tenant.id })
      .returning();

    // Act: Owner B tries to add payment
    const res = await client.api.owners.leases[":id"].payments.$post(
      {
        param: { id: lease.id.toString() },
        json: { amount: 500, datePaid: "2026-02-18", paymentType: "rent" },
      },
      { headers: { Cookie: ownerB.cookie } },
    );

    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });
});
