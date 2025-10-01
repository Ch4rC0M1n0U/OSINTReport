import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue()],
    server: {
      port: Number(env.VITE_DEV_SERVER_PORT ?? 5173),
      host: env.VITE_DEV_SERVER_HOST ?? "0.0.0.0",
      proxy: {
        "/api": {
          target: env.VITE_API_URL ?? "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4173,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./tests/setup.ts",
      css: true,
      coverage: {
        reporter: ["text", "html"],
      },
    },
  };
});
