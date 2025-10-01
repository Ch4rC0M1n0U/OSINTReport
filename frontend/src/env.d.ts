/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_SERVER_PORT?: string;
  readonly VITE_DEV_SERVER_HOST?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
