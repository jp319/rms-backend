import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import type { CreateLeaseInput } from "@/modules/leases/leases.schema";
import type { Unit, UpdateUnitInput } from "@/modules/units/units.schema";

import { leaseRepository } from "@/modules/leases/leases.repository";
import { unitsRepository } from "@/modules/units/units.repository";

export const unitsService = {
  findByIdAndOwnerId: async (
    id: number,
    ownerId: number,
  ): Promise<Unit | undefined> => {
    const unit = await unitsRepository.findByIdAndOwnerId(id, ownerId);
    if (!unit) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Unit not found",
      });
    }
    return unit;
  },
  findAllByOwner: async (ownerId: number) => {
    return await unitsRepository.findByOwnerId(ownerId);
  },
  updateByIdAndOwnerId: async (
    id: number,
    ownerId: number,
    input: UpdateUnitInput,
  ) => {
    const validUnit = await unitsRepository.findByIdAndOwnerId(id, ownerId);
    if (!validUnit) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Unit not found",
      });
    }
    const updated = await unitsRepository.update(id, input);

    if (!updated) {
      throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to update unit",
      });
    }

    return updated;
  },
  findAllLeasesByUnitIdAndOwnerId: async (unitId: number, ownerId: number) => {
    const validUnit = await unitsRepository.findByIdAndOwnerId(unitId, ownerId);

    if (!validUnit) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Unit not found",
      });
    }

    const leases = await leaseRepository.findByOwnerId(ownerId);

    if (!leases) {
      throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to find leases",
      });
    }

    return leases;
  },
  createLease: async (
    unitId: number,
    ownerId: number,
    input: CreateLeaseInput,
  ) => {
    const validUnit = await unitsRepository.findByIdAndOwnerId(unitId, ownerId);

    if (!validUnit) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Unit not found",
      });
    }

    const isAvailable = unitsRepository.isAvailable(unitId);

    if (!isAvailable) {
      throw new HTTPException(StatusCodes.BAD_REQUEST, {
        message: "Unit is not available",
      });
    }

    const created = await leaseRepository.create(unitId, input);

    if (!created) {
      throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to create lease",
      });
    }

    return created;
  },
};
