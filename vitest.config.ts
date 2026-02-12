import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    pool: "threads",
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    env: loadEnv("test", process.cwd(), ""),
  },
});
