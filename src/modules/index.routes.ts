import { createRouter } from "@/shared/create-app";

const router = createRouter().get("/", (c) => {
  return c.json({ message: "Welcome to RMS API" }, 200);
});

export default router;
