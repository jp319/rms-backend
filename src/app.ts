import authRoutes from "@/modules/auth/auth.routes";
import indexRoutes from "@/modules/index.routes";
import propertyRoutes from "@/modules/properties/properties.routes";
import unitRoutes from "@/modules/units/units.routes";
import { createApp } from "@/shared/create-app";

const app = createApp();

const routes = app
  .route("/", indexRoutes)
  .route("/", authRoutes)
  .route("/", propertyRoutes)
  .route("/", unitRoutes);

// Dont load OpenAPI documentation in test environment
// To prevent "createRequire" errors in Vitest
if (process.env.NODE_ENV !== "test") {
  import("@/modules/openapi/openapi.routes")
    .then(({ default: configureOpenAPI }) => {
      configureOpenAPI(app);
    })
    .catch((err) => {
      // oxlint-disable-next-line no-console
      console.error("Failed to load OpenAPI:", err);
    });
}

export type AppType = typeof routes;

export default app;
