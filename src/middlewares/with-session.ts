import type { MiddlewareHandler } from "hono";

import type { AppBindings } from "@/shared/types";

import createAuth from "@/shared/auth";
import ownerRepository from "@/shared/db/repository/owner.repository";

const withSession: MiddlewareHandler<AppBindings> = async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("session", null);
    c.set("user", null);
    c.set("owner", null);
    return next();
  }

  c.set("session", session.session);
  c.set("user", session.user);

  const owner = await ownerRepository.findByUserId(session.user.id);

  if (owner) {
    c.set("owner", owner);
  }

  return next();
};

export default withSession;
