import type { Context } from "hono";

import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

import * as contracts from "@/modules/units/units.contracts";
import { unitsService } from "@/modules/units/units.service";
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
    const data = await unitsService.findAllByOwner(owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.getOne, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await unitsService.findByIdAndOwnerId(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.update, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");

    const data = await unitsService.updateByIdAndOwnerId(id, owner.id, updates);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.listLeases, async (c) => {
    const { id } = c.req.valid("param");
    const owner = checkOwner(c);
    const data = await unitsService.findAllLeasesByUnitIdAndOwnerId(
      id,
      owner.id,
    );
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.createLease, async (c) => {
    const { id } = c.req.valid("param");
    const validated = c.req.valid("json");
    const owner = checkOwner(c);
    const data = await unitsService.createLease(id, owner.id, validated);
    return c.json({ data }, StatusCodes.CREATED);
  });

export type AppType = typeof router;

export default router;
