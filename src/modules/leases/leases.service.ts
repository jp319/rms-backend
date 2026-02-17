import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { UpdateLeaseInput } from "@/modules/leases/leases.schema";

import { leasesRepository } from "@/modules/leases/leases.repository";

export const leasesService = {
  update: async (id: number, ownerId: number, input: UpdateLeaseInput) => {
    const lease = await leasesRepository.findByIdAndOwnerId(id, ownerId);

    if (!lease) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Lease not found",
      });
    }

    const updated = await leasesRepository.update(id, input);

    if (!updated) {
      throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to update lease",
      });
    }

    return updated;
  },
  findAllByOwner: async (ownerId: number) => {
    const leases = await leasesRepository.findByOwnerId(ownerId);

    if (!leases) {
      throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to find leases",
      });
    }

    return leases;
  },
  findByIdAndOwnerId: async (id: number, ownerId: number) => {
    const lease = await leasesRepository.findByIdAndOwnerId(id, ownerId);

    if (!lease) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Lease not found",
      });
    }

    return lease;
  },
};
