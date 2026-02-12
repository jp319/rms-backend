import auth from "@/routes/auth/auth.index";
import index from "@/routes/index.route";
import { createApp } from "@/shared/create-app";

const app = createApp();

const routes = app.route("/", index).route("/auth", auth);

export type AppType = typeof routes;

export default app;
