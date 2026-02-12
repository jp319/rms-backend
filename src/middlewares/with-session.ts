import type { MiddlewareHandler } from "hono";

import type { AppBindings } from "@/shared/types";

import createAuth from "@/shared/auth";

const withSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
};

export default withSession;
