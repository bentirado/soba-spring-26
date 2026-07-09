import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const normalizedSupabaseUrl = supabaseUrl
  ?.replace(/\/rest\/v1\/?$/, "")
  .replace(/\/auth\/v1\/?$/, "")
  .replace(/\/$/, "");

export const supabaseConfigError =
  !normalizedSupabaseUrl || !supabaseAnonKey
    ? "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env."
    : "";

export const supabase = supabaseConfigError
  ? null
  : createClient(normalizedSupabaseUrl, supabaseAnonKey);
