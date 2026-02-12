import { defineRelations } from "drizzle-orm";

import {
  accounts,
  apikeys,
  leases,
  owners,
  payments,
  properties,
  propertyImages,
  sessions,
  tenants,
  units,
  users,
} from "@/shared/db/schemas";

export const relations = defineRelations(
  {
    accounts,
    apikeys,
    leases,
    owners,
    payments,
    properties,
    propertyImages,
    sessions,
    tenants,
    units,
    users,
  },
  (relation) => ({
    accounts: {
      user: relation.one.users({
        from: relation.accounts.userId,
        to: relation.users.id,
      }),
    },
    apikeys: {
      user: relation.one.users({
        from: relation.apikeys.userId,
        to: relation.users.id,
      }),
    },
    leases: {
      payments: relation.many.payments({
        from: relation.leases.id,
        to: relation.payments.leaseId,
      }),
      tenant: relation.one.tenants({
        from: relation.leases.tenantId,
        to: relation.tenants.id,
      }),
      unit: relation.one.units({
        from: relation.leases.unitId,
        to: relation.units.id,
      }),
    },
    owners: {
      properties: relation.many.properties({
        from: relation.owners.id,
        to: relation.properties.ownerId,
      }),
      user: relation.one.users({
        from: relation.owners.userId,
        to: relation.users.id,
      }),
    },
    payments: {
      lease: relation.one.leases({
        from: relation.payments.leaseId,
        to: relation.leases.id,
      }),
    },
    properties: {
      images: relation.many.propertyImages({
        from: relation.properties.id,
        to: relation.propertyImages.propertyId,
      }),
      owner: relation.one.owners({
        from: relation.properties.ownerId,
        to: relation.owners.id,
      }),
      units: relation.many.units({
        from: relation.properties.id,
        to: relation.units.propertyId,
      }),
    },
    propertyImages: {
      property: relation.one.properties({
        from: relation.propertyImages.propertyId,
        to: relation.properties.id,
      }),
    },
    sessions: {
      user: relation.one.users({
        from: relation.sessions.userId,
        to: relation.users.id,
      }),
    },
    tenants: {
      leases: relation.many.leases({
        from: relation.tenants.id,
        to: relation.leases.tenantId,
      }),
    },
    units: {
      leases: relation.many.leases({
        from: relation.units.id,
        to: relation.leases.unitId,
      }),
      property: relation.one.properties({
        from: relation.units.propertyId,
        to: relation.properties.id,
      }),
    },
    users: {
      accounts: relation.many.accounts({
        from: relation.users.id,
        to: relation.accounts.userId,
      }),
      apikeys: relation.many.apikeys({
        from: relation.users.id,
        to: relation.apikeys.userId,
      }),
      owner: relation.one.owners({
        from: relation.users.id,
        to: relation.owners.userId,
      }),
      sessions: relation.many.sessions({
        from: relation.users.id,
        to: relation.sessions.userId,
      }),
    },
  }),
);
