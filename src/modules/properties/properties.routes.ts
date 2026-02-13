import type { Context } from "hono";

import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import {
  createPropertySchema,
  updatePropertySchema,
} from "@/modules/properties/properties.schema";
import { propertiesService } from "@/modules/properties/properties.service"; // 👈 Use Service
import { createRouter } from "@/shared/create-app";

const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const checkOwner = (c: Context) => {
  const owner = c.get("owner");
  if (!owner) throw new HTTPException(401, { message: "Unauthorized" });
  return owner;
};

const router = createRouter()
  .get("/api/owners/properties", async (c) => {
    const owner = checkOwner(c);
    const data = await propertiesService.findAllByOwner(owner.id);
    return c.json({ data });
  })

  .post(
    "/api/owners/properties",
    zValidator("json", createPropertySchema),
    async (c) => {
      const owner = checkOwner(c);
      const validated = c.req.valid("json");
      const data = await propertiesService.create(owner.id, validated);
      return c.json({ data });
    },
  )

  .get(
    "/api/owners/properties/:id",
    zValidator("param", paramSchema),
    async (c) => {
      const owner = checkOwner(c);
      const { id } = c.req.valid("param");
      const data = await propertiesService.findOne(id, owner.id);
      return c.json({ data });
    },
  )

  .patch(
    "/api/owners/properties/:id",
    zValidator("param", paramSchema),
    zValidator("json", updatePropertySchema),
    async (c) => {
      const owner = checkOwner(c);
      const { id } = c.req.valid("param");
      const updates = c.req.valid("json");
      const data = await propertiesService.update(id, owner.id, updates);
      return c.json({ data });
    },
  );

export default router;
