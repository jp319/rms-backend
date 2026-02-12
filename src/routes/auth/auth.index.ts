import createAuth from "@/shared/auth";
import { createRouter } from "@/shared/create-app";

const router = createRouter().all("/api/auth/**", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export default router;
