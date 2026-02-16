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

import type { AppType } from "@/modules/tenants/tenants.routes";

import env from "@/env";
import tenantsRoutes from "@/modules/tenants/tenants.routes";
import { createTestApp } from "@/shared/create-app";
import createDb from "@/shared/db";
import { leases, properties, tenants, units } from "@/shared/db/schemas";

vi.mock("@/modules/mail/mail.service", () => ({ sendEmail: vi.fn() }));

describe("Tenants Integration", () => {
  const client = testClient<AppType>(createTestApp(tenantsRoutes));

  it("should list units for the logged-in owner", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

    const db = createDb(env);

    const inserts = [];

    for (let i = 0; i < 3; i++) {
      inserts.push({
        ...generateTenant({ name: `John Doe ${i}` }),
        ownerId: owner.id,
      });
    }

    await db.insert(tenants).values(inserts);

    const res = await client.api.owners.tenants.$get(
      {},
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);

    if (res.status === StatusCodes.OK) {
      const { data } = await res.json();
      expect(data.length).toBe(3);
    }
  });

  it("should create a new tenant", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

    const tenant = generateTenant({ name: "John Doe" });

    const res = await client.api.owners.tenants.$post(
      {
        json: tenant,
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.CREATED);

    if (res.status === StatusCodes.CREATED) {
      const { data } = await res.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe(tenant.name);
      expect(data.ownerId).toBe(owner.id);
    }
  });

  it("should update a tenant", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

    const db = createDb(env);

    const tenant = generateTenant({ name: "John Doe" });

    const [created] = await db
      .insert(tenants)
      .values({
        ...tenant,
        ownerId: owner.id,
      })
      .returning();

    const res = await client.api.owners.tenants[":id"].$patch(
      {
        param: { id: created.id.toString() },
        json: { name: "Jane Doe" },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);

    if (res.status === StatusCodes.OK) {
      const { data } = await res.json();
      expect(data.id).toBe(created.id);
      expect(data.name).toBe("Jane Doe");
      expect(data.ownerId).toBe(owner.id);
    }
  });

  it("should view a tenant", async () => {
    const { cookie, owner } = await createAndLoginOwner("prop-create");

    const db = createDb(env);

    const [tenant] = await db
      .insert(tenants)
      .values({
        ...generateTenant({ name: "John Doe" }),
        ownerId: owner.id,
      })
      .returning();

    if (!tenant) throw new Error("Tenant not created for test user");

    const res = await client.api.owners.tenants[":id"].$get(
      {
        param: { id: tenant.id.toString() },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);

    if (res.status === StatusCodes.OK) {
      const { data } = await res.json();
      expect(data.id).toBe(tenant.id);
      expect(data.name).toBe("John Doe");
      expect(data.ownerId).toBe(owner.id);
    }
  });

  it("should list leases for a tenant", async () => {
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

    const res = await client.api.owners.tenants[":id"].leases.$get(
      {
        param: {
          id: tenant.id.toString(),
        },
      },
      { headers: { Cookie: cookie } },
    );

    expect(res.status).toBe(StatusCodes.OK);

    if (res.status === StatusCodes.OK) {
      const { data } = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(lease.id);
      expect(data[0].unitId).toBe(unit.id);
    }
  });
});
