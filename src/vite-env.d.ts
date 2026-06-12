/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_SHA?: string;
  readonly VITE_ENABLE_DEV_SYSTEM_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
