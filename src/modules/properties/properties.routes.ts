import type { Context } from "hono";

import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

import * as contracts from "@/modules/properties/properties.contracts";
import { propertiesService } from "@/modules/properties/properties.service";
import { propertyImagesService } from "@/modules/property-images/property-images.service";
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
  })

  .openapi(contracts.getImageUploadUrl, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const { fileName, contentType } = c.req.valid("json");
    const data = await propertyImagesService.getUploadUrl(
      id,
      owner.id,
      fileName,
      contentType,
    );
    return c.json(data, StatusCodes.OK);
  })

  .openapi(contracts.createPropertyImage, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const validated = c.req.valid("json");
    const data = await propertyImagesService.create(id, owner.id, validated);
    return c.json({ data }, StatusCodes.CREATED);
  })

  .openapi(contracts.listPropertyImages, async (c) => {
    const owner = checkOwner(c);
    const { id } = c.req.valid("param");
    const data = await propertyImagesService.findAll(id, owner.id);
    return c.json({ data }, StatusCodes.OK);
  })

  .openapi(contracts.deletePropertyImage, async (c) => {
    const owner = checkOwner(c);
    const { id, imageId } = c.req.valid("param");
    await propertyImagesService.delete(imageId, id, owner.id);
    return c.json({ success: true }, StatusCodes.OK);
  });

export type AppType = typeof router;

export default router;
