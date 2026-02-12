import type { Schema } from "hono";

import { Hono } from "hono";
import { requestId } from "hono/request-id";

import type { AppAPI, AppBindings } from "@/shared/types";

import env from "@/env";
import authCors from "@/middlewares/auth-cors";
import notFound from "@/middlewares/not-found";
import onError from "@/middlewares/on-error";
import withSession from "@/middlewares/with-session";

export const createRouter = () => {
  return new Hono<AppBindings>({
    strict: false,
  });
};

export const createApp = () => {
  const app = createRouter();

  app.use((c, next) => {
    c.env = env;
    return next();
  });

  app.use("/api/auth/*", authCors);
  app.use("*", withSession);

  app.use(requestId());
  app.onError(onError);
  app.notFound(notFound);

  return app;
};

export const createTestApp = <S extends Schema>(router: AppAPI<S>) => {
  return createApp().route("/", router);
};
