import type { Schema } from "hono";

import { OpenAPIHono } from "@hono/zod-openapi";
import { requestId } from "hono/request-id";

import type { AppAPI, AppBindings } from "@/shared/types";

import env from "@/env";
import authCors from "@/middlewares/auth-cors";
import notFound from "@/middlewares/not-found";
import onError from "@/middlewares/on-error";
import { pinoLogger } from "@/middlewares/pino-logger";
import withSession from "@/middlewares/with-session";
import { defaultHook } from "@/shared/openapi-hook";

export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
};

export const createApp = () => {
  const app = createRouter();

  app.use(pinoLogger());

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
