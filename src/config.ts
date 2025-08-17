export type BackendProvider = "supabase" | "flask";

// NOTE: Lovable environment does not support .env. Configure here for now.
export const BACKEND_PROVIDER: BackendProvider = "supabase";

export const APP_CONFIG = {
  BACKEND_PROVIDER,
  SUPABASE_URL: "https://hgagdumrfcftcphylgvc.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYWdkdW1yZmNmdGNwaHlsZ3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTg2OTUsImV4cCI6MjA3MDI5NDY5NX0.jofu_QY_BgrUr-athM9B5QhP5IDHX0M5HxtNEcBVObQ",
} as const;
