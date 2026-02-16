import { createRoute, z } from "@hono/zod-openapi";
import { StatusCodes } from "http-status-toolkit";

import { createRouter } from "@/shared/create-app";

const router = createRouter().openapi(
  createRoute({
    path: "/",
    method: "get",
    responses: {
      [StatusCodes.OK]: {
        description: "Welcome message",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Welcome message",
                example: "Welcome to RMS API",
              }),
            }),
          },
        },
      },
    },
    tags: ["Index"],
    summary: "Welcome message",
  }),
  (c) => {
    return c.json({ message: "Welcome to RMS API" }, StatusCodes.OK);
  },
);

export default router;
