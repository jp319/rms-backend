import type { Context } from "hono";

import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";
import { z } from "zod";

import type { AppBindings } from "@/shared/types";

import { createLeaseSchema } from "@/modules/leases/leases.schema";
import { updateUnitSchema } from "@/modules/units/units.schema";
import { unitsService } from "@/modules/units/units.service";
import { createRouter } from "@/shared/create-app";

const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const checkOwner = (c: Context<AppBindings>) => {
  const owner = c.get("owner");
  if (!owner)
    throw new HTTPException(StatusCodes.UNAUTHORIZED, {
      message: "Unauthorized",
    });
  return owner;
};

const router = createRouter()
  .get("/api/owners/units", async (c) => {
    const owner = checkOwner(c);
    const data = await unitsService.findAllByOwner(owner.id);
    return c.json({ data });
  })
  .get("/api/owners/units/:id", zValidator("param", paramSchema), async (c) => {
    const { id } = c.req.valid("param");
    const owner = checkOwner(c);
    const data = await unitsService.findByIdAndOwnerId(id, owner.id);
    return c.json({ data });
  })
  .patch(
    "/api/owners/units/:id",
    zValidator("param", paramSchema),
    zValidator("json", updateUnitSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const validated = c.req.valid("json");
      const owner = checkOwner(c);
      const data = await unitsService.updateByIdAndOwnerId(
        id,
        owner.id,
        validated,
      );
      return c.json({ data });
    },
  )
  .get(
    "/api/owners/units/:id/leases",
    zValidator("param", paramSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const owner = checkOwner(c);
      const data = await unitsService.findAllLeasesByUnitIdAndOwnerId(
        id,
        owner.id,
      );
      return c.json({ data });
    },
  )
  .post(
    "/api/owners/units/:id/leases",
    zValidator("param", paramSchema),
    zValidator("json", createLeaseSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const validated = c.req.valid("json");
      const owner = checkOwner(c);
      const data = await unitsService.createLease(id, owner.id, validated);
      return c.json({ data }, StatusCodes.CREATED);
    },
  );

export type AppType = typeof router;

export default router;
