import type { Hook } from "@hono/zod-openapi";

import { StatusCodes } from "http-status-toolkit";

import type { AppBindings } from "@/shared/types";

export const defaultHook: Hook<unknown, AppBindings, string, unknown> = (
  result,
  c,
) => {
  if (!result.success) {
    return c.json(
      {
        success: result.success,
        error: {
          name: result.error.name,
          issues: result.error.issues,
        },
      },
      StatusCodes.UNPROCESSABLE_ENTITY,
    );
  }
};
