import { HTTPException } from "hono/http-exception";

import { propertiesRepository } from "@/modules/properties/properties.repository";
import {
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from "@/modules/properties/properties.schema";

export const propertiesService = {
  findAllByOwner: async (ownerId: number) => {
    return await propertiesRepository.findByOwnerId(ownerId);
  },

  create: async (ownerId: number, data: CreatePropertyInput) => {
    const created = await propertiesRepository.create(ownerId, data);

    if (!created) {
      throw new HTTPException(500, { message: "Failed to create property" });
    }

    return created;
  },

  findOne: async (id: number, ownerId: number) => {
    const property = await propertiesRepository.checkOwner(id, ownerId);

    if (!property) {
      throw new HTTPException(404, { message: "Property not found" });
    }

    return property;
  },

  update: async (id: number, ownerId: number, data: UpdatePropertyInput) => {
    const updated = await propertiesRepository.update(id, ownerId, data);

    if (!updated) {
      throw new HTTPException(404, {
        message: "Property not found or unauthorized",
      });
    }

    return updated;
  },
};
