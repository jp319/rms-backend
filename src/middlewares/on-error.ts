import type { Context, Env, ErrorHandler, Input } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { DrizzleQueryError } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";
import { DatabaseError } from "pg";
import { PostgresError } from "pg-error-enum";
import { ZodError } from "zod";

const makeResponse = (
  c: Context<Env, string, Input>,
  message: string,
  stack: string | undefined,
  statusCode: ContentfulStatusCode,
) => {
  return c.json(
    {
      message,
      stack,
    },
    statusCode,
  );
};

const onError: ErrorHandler = (err, c) => {
  // eslint-disable-next-line node/prefer-global/process
  const env = c.env?.NODE_ENV || process.env?.NODE_ENV;
  const isProd = env === "production";

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR as ContentfulStatusCode;
  let message = "Something went wrong. Please try again later."; // Friendly default
  const stack = isProd ? undefined : err.stack;

  // 1. HTTP Errors (Manual throws)
  if (err instanceof HTTPException) {
    statusCode = err.status;
    message = err.message;
    return makeResponse(c, message, stack, statusCode as ContentfulStatusCode);
  }

  // 2. Validation Errors (Zod)
  if (err instanceof ZodError) {
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = "The provided data is invalid. Please check your inputs.";
    // Note: You could append `err.issues` to the response here if you wanted
    return makeResponse(c, message, stack, statusCode as ContentfulStatusCode);
  }

  // 3. Database Constraints (Postgres)
  if (err instanceof DrizzleQueryError) {
    if (err.cause instanceof DatabaseError) {
      // Duplicate Key (e.g., Email already taken)
      if (err.cause.code === PostgresError.UNIQUE_VIOLATION) {
        return makeResponse(
          c,
          "A record with this information already exists.",
          stack,
          StatusCodes.CONFLICT,
        );
      }

      // Foreign Key (e.g., Trying to delete an Owner who has Properties)
      if (err.cause.code === PostgresError.FOREIGN_KEY_VIOLATION) {
        return makeResponse(
          c,
          "This action cannot be completed because this item is currently being used by other records.",
          stack,
          StatusCodes.CONFLICT,
        );
      }

      // Not Null (e.g., Missing required field in raw SQL)
      if (err.cause.code === PostgresError.NOT_NULL_VIOLATION) {
        return makeResponse(
          c,
          "A required field is missing.",
          stack,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Check Constraint (e.g., Price < 0)
      if (err.cause.code === PostgresError.CHECK_VIOLATION) {
        return makeResponse(
          c,
          "The provided data contains invalid values.",
          stack,
          StatusCodes.BAD_REQUEST,
        );
      }
    }
  }

  // 4. Fallback (Unknown Error)
  statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  message = isProd ? "Internal Server Error" : err.message;

  return makeResponse(c, message, stack, statusCode as ContentfulStatusCode);
};

export default onError;
