import type { Context } from "hono";

import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import type { AppBindings } from "@/shared/types";

import {
  createPropertySchema,
  updatePropertySchema,
} from "@/modules/properties/properties.schema";
import { propertyRepository } from "@/modules/properties/property.repository";
import { createRouter } from "@/shared/create-app";

const paramSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const checkOwner = (c: Context<AppBindings>) => {
  const owner = c.get("owner");
  if (!owner) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return owner;
};

const router = createRouter()
  .get("/api/owners/properties", async (c) => {
    const owner = checkOwner(c);
    const data = await propertyRepository.findByOwnerId(owner.id);
    return c.json({ data });
  })
  .post(
    "/api/owners/properties",
    zValidator("json", createPropertySchema),
    async (c) => {
      const owner = checkOwner(c);
      const validated = c.req.valid("json");
      const data = await propertyRepository.create(owner.id, validated);

      // Safety check in case insert fails silently (unlikely with .returning)
      if (!data)
        throw new HTTPException(500, { message: "Failed to create property" });

      return c.json({ data });
    },
  )
  .get(
    "/api/owners/properties/:id",
    zValidator("param", paramSchema),
    async (c) => {
      const owner = checkOwner(c);
      const { id } = c.req.valid("param");

      const data = await propertyRepository.checkOwner(id, owner.id);

      // FIX: Return 404 if property not found or doesn't belong to an owner
      if (!data) {
        throw new HTTPException(404, { message: "Property not found" });
      }

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

      const updatedProperty = await propertyRepository.update(
        id,
        owner.id,
        updates,
      );

      if (!updatedProperty) {
        throw new HTTPException(404, {
          message: "Property not found or unauthorized",
        });
      }

      return c.json({ data: updatedProperty });
    },
  );

export default router;
