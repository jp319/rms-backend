import { createRoute, z } from "@hono/zod-openapi";
import { StatusCodes } from "http-status-toolkit";

import {
  selectLeaseSchema,
  updateLeaseSchema,
} from "@/modules/leases/leases.schema";
import {
  createPaymentSchema,
  selectPaymentSchema,
} from "@/modules/payments/payments.schema";
import {
  IdParamsSchema,
  createErrorSchema,
  jsonContent,
  jsonContentRequired,
  notFoundSchema,
} from "@/shared/openapi-helpers";

export const list = createRoute({
  path: "/api/owners/leases",
  method: "get",
  tags: ["Leases"],
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: z.array(selectLeaseSchema),
      }),
      "List of leases",
    ),
  },
});

export const getOne = createRoute({
  path: "/api/owners/leases/{id}",
  method: "get",
  tags: ["Leases"],
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: selectLeaseSchema,
      }),
      "Lease details",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Lease not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid ID",
    ),
  },
});

export const update = createRoute({
  path: "/api/owners/leases/{id}",
  method: "patch",
  tags: ["Leases"],
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(updateLeaseSchema, "Update a lease"),
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: selectLeaseSchema,
      }),
      "Lease updated",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Lease not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(updateLeaseSchema).or(
        createErrorSchema(IdParamsSchema),
      ),
      "Validation error(s)",
    ),
  },
});

export const listPayments = createRoute({
  path: "/api/owners/leases/{id}/payments",
  method: "get",
  tags: ["Payments"],
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [StatusCodes.OK]: jsonContent(
      z.object({
        data: z.array(selectPaymentSchema),
      }),
      "List of payments",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Lease not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(IdParamsSchema),
      "Invalid ID",
    ),
  },
});

export const createPayment = createRoute({
  path: "/api/owners/leases/{id}/payments",
  method: "post",
  tags: ["Payments"],
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(createPaymentSchema, "Create a payment"),
  },
  responses: {
    [StatusCodes.CREATED]: jsonContent(
      z.object({
        data: selectPaymentSchema,
      }),
      "Payment created",
    ),
    [StatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Lease not found"),
    [StatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createPaymentSchema).or(
        createErrorSchema(IdParamsSchema),
      ),
      "Validation error(s)",
    ),
  },
});
