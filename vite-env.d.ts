/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_TOKEN: string;
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_MODEL_NAME: string;
  readonly VITE_LOCAL_ENDPOINT: string;
  readonly VITE_LOCAL_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
