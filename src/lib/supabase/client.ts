import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://heqwheucrnlrrhefjufn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_9ObMKpHncUpevznyhs_h6A_uScDIfjY";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
