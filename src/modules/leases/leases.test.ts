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
});
