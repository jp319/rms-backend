import type { z } from "@hono/zod-openapi";
import type { Session, User } from "better-auth";
import type { Hono, Schema } from "hono";

import type { Environment } from "@/env";
import type { Owner } from "@/modules/owners/owners.repository";

export type AppBindings = {
  Bindings: Environment;
  Variables: {
    user: User | null;
    session: Session | null;
    owner: Owner | null;
  };
};

export type AppAPI<S extends Schema = {}> = Hono<AppBindings, S>;
export type ZodSchema = z.ZodType<unknown, unknown, z.core.$ZodTypeInternals>;
export type ZodIssue = z.core.$ZodIssue;
