declare module "vite" {
  export type PluginOption = unknown;

  export interface ProxyOptions {
    target: string;
    changeOrigin?: boolean;
    secure?: boolean;
  }

  export interface UserConfig {
    plugins?: PluginOption[];
    server?: {
      port?: number;
      host?: string;
      proxy?: Record<string, ProxyOptions>;
    };
    preview?: {
      port?: number;
    };
    resolve?: {
      alias?: Record<string, string>;
    };
  }

  export interface ConfigEnv {
    mode: string;
    command: "serve" | "build";
  }

  export function defineConfig(config: UserConfig | ((env: ConfigEnv) => UserConfig)): UserConfig;
  export function loadEnv(mode: string, root: string, prefix?: string): Record<string, string>;
}

declare module "@vitejs/plugin-vue" {
  import type { PluginOption } from "vite";

  export interface VuePluginOptions {
    reactivityTransform?: boolean;
  }

  export default function vue(options?: VuePluginOptions): PluginOption;
}
