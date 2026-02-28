/* Ambient types for core package (build/runtime env) */
interface ImportMeta {
  env?: {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };
}

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;
