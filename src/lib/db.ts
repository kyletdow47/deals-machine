import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Dummy client for build time — will fail at runtime if not configured
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
}

export { supabase, uuid };
export default supabase;
