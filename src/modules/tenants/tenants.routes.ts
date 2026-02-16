import type { Context } from "hono";

import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

import * as contracts from "@/modules/tenants/tenants.contracts";
import { tenantsService } from "@/modules/tenants/tenants.service";
import { createRouter } from "@/shared/create-app";

const checkOwner = (c: Context<AppBindings>) => {
  const owner = c.get("owner");
  if (!owner)
    throw new HTTPException(StatusCodes.UNAUTHORIZED, {
      message: "Unauthorized",
    });
  return owner;
};

const router = createRouter()
  .openapi(contracts.list, async (c) => {
    const owner = checkOwner(c);
    const data = await tenantsService.findAllByOwner(owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.create, async (c) => {
    const owner = checkOwner(c);
    const validated = c.req.valid("json");
    const data = await tenantsService.create(owner.id, validated);
    return c.json({ data }, StatusCodes.CREATED);
  })

  .openapi(contracts.getOne, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await tenantsService.findOne(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.update, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const validated = c.req.valid("json");
    const data = await tenantsService.update(id, owner.id, validated);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.listLeases, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await tenantsService.findLeases(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  });

export type AppType = typeof router;

export default router;
