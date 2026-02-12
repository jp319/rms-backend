import { cors } from "hono/cors";

const authCors = cors({
  origin: "http://localhost:3000",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});

export default authCors;
