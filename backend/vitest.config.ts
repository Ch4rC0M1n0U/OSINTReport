import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup/test-env.ts"],
    dir: "tests",
    reporters: process.env.CI ? ["default", "junit"] : "default",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@config": path.resolve(__dirname, "src/config"),
      "@middleware": path.resolve(__dirname, "src/middleware"),
      "@modules": path.resolve(__dirname, "src/modules"),
      "@routes": path.resolve(__dirname, "src/routes"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
