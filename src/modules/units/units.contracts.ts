import { createRoute, z } from "@hono/zod-openapi";
import { StatusCodes } from "http-status-toolkit";

import {
  createLeaseSchema,
  selectLeaseSchema,
} from "@/modules/leases/leases.schema";
import {
  selectUnitSchema,
  updateUnitSchema,
} from "@/modules/units/units.schema";
import {
  IdParamsSchema,
  createErrorSchema,
  jsonContent,
  jsonContentRequired,
  notFoundSchema,
} from "@/shared/openapi-helpers";

export const list = createRoute({
  path: "/api/owners/units",
  method: "get",
  tags: ["Units"],
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: z.array(selectUnitSchema),
      }),
      "List of units",
    ),
  },
});

export const getOne = createRoute({
  path: "/api/owners/units/{id}",
  method: "get",
  tags: ["Units"],
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: selectUnitSchema.optional(),
      }),
      "Unit details",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Unit not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid unit ID",
    ),
  },
});

export const update = createRoute({
  path: "/api/owners/units/{id}",
  method: "patch",
  tags: ["Units"],
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(updateUnitSchema, "Update a unit"),
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: selectUnitSchema,
      }),
      "Unit updated",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Unit not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(updateUnitSchema).or(createErrorSchema(IdParamsSchema)),
      "Validation error(s)",
    ),
  },
});

export const listLeases = createRoute({
  path: "/api/owners/units/{id}/leases",
  method: "get",
  tags: ["Units"],
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: z.array(selectLeaseSchema),
      }),
      "List of leases for the unit",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Unit not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid unit ID",
    ),
  },
});

export const createLease = createRoute({
  path: "/api/owners/units/{id}/leases",
  method: "post",
  tags: ["Units"],
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(createLeaseSchema, "Create a lease"),
  },
  responses: {
    [StatusCodes.CREATED]: jsonContent(
      z.object({
        data: selectLeaseSchema,
      }),
      "Lease created",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Unit not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createLeaseSchema).or(
        createErrorSchema(IdParamsSchema),
      ),
      "Validation error(s)",
    ),
  },
});
