/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GITHUB_TOKEN: string;
    readonly VITE_OPENROUTER_API_KEY: string;
    readonly VITE_MODEL_NAME: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
