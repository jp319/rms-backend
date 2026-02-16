import type { OpenAPIHono } from "@hono/zod-openapi";

import { Scalar } from "@scalar/hono-api-reference";

import type { AppBindings } from "@/shared/types";

export default function configureOpenAPI(app: OpenAPIHono<AppBindings>) {
  // 1. The JSON Spec (The raw data)
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "RMS API",
      description: "Rental Management System API Documentation",
    },
  });

  // 2. The UI (The beautiful page)
  app.get(
    "/reference",
    Scalar({
      sources: [
        {
          title: "RMS API",
          url: "/doc",
        },
        {
          title: "RMS AUTH API",
          url: "/api/auth/open-api/generate-schema",
        },
      ],
    }),
  );
}
