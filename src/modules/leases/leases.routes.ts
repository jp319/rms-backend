import type { Context } from "hono";

import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

import * as contracts from "@/modules/leases/leases.contracts";
import { leasesService } from "@/modules/leases/leases.service";
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
    const data = await leasesService.findAllByOwner(owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.getOne, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await leasesService.findByIdAndOwnerId(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.update, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const validated = c.req.valid("json");
    const data = await leasesService.update(id, owner.id, validated);
    return c.json({ data }, StatusCodes.OK);
  });

export type AppType = typeof router;

export default router;
