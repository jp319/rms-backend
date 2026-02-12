import authRoutes from "@/modules/auth/auth.routes";
import indexRoutes from "@/modules/index.routes";
import propertyRoutes from "@/modules/properties/property.routes";
import { createApp } from "@/shared/create-app";

const app = createApp();

const routes = app
  .route("/", indexRoutes)
  .route("/", authRoutes)
  .route("/", propertyRoutes);

export type AppType = typeof routes;

export default app;
