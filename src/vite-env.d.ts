/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT_SHA?: string;
  readonly VITE_ENABLE_DEV_SYSTEM_STATUS?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APEX_API_BASE_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_PUBLIC_BUILDER_KEY?: string;
  readonly VITE_DEV_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
