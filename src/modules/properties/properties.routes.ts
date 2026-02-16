import type { Context } from "hono";

import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

import * as contracts from "@/modules/properties/properties.contracts";
import { propertiesService } from "@/modules/properties/properties.service";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/shared/constants";
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
    const data = await propertiesService.findAllByOwner(owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.create, async (c) => {
    const owner = checkOwner(c);
    const validated = c.req.valid("json");
    const data = await propertiesService.create(owner.id, validated);
    return c.json({ data }, StatusCodes.CREATED);
  })

  .openapi(contracts.getOne, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await propertiesService.findOne(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.update, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const updates = c.req.valid("json");

    if (Object.keys(updates).length === 0) {
      return c.json(
        {
          success: false,
          error: {
            issues: [
              {
                code: ZOD_ERROR_CODES.INVALID_UPDATES,
                path: [],
                message: ZOD_ERROR_MESSAGES.NO_UPDATES,
              },
            ],
            name: "ZodError",
          },
        },
        StatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    const data = await propertiesService.update(id, owner.id, updates);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.listUnits, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await propertiesService.findUnits(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.createUnit, async (c) => {
    const owner = checkOwner(c);
    const { id: propertyId } = c.req.valid("param");
    const validated = c.req.valid("json");
    const data = await propertiesService.createUnit(
      propertyId,
      owner.id,
      validated,
    );
    return c.json({ data }, StatusCodes.CREATED);
  });

export type AppType = typeof router;

export default router;
