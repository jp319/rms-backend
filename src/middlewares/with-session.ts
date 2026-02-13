import type { MiddlewareHandler } from "hono";

import type { AppBindings } from "@/shared/types";

import ownersRepository from "@/modules/owners/owners.repository";
import createAuth from "@/shared/auth";

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

  const owner = await ownersRepository.findByUserId(session.user.id);

  if (owner) {
    c.set("owner", owner);
  }

  return next();
};

export default withSession;
