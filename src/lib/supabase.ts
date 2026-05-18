import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://nemrqkkuptdikiqqgaho.supabase.co";
const anon =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbXJxa2t1cHRkaWtpcXFnYWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTQ2MDUsImV4cCI6MjA5NDY5MDYwNX0.SXSokrFRRq9aDwj_nxuULoqLOdSO6FSJbPRa9KTOeEI";

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    storage:
      typeof window !== "undefined"
        ? window.localStorage
        : undefined,
  },
});
