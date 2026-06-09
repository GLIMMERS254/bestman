import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://ihqpdlkwipxnnzpkjmlb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlocXBkbGt3aXB4bm56cGtqbWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDI0OTksImV4cCI6MjA5NjU3ODQ5OX0.2mrnOuL7YyjfzABJ8ocePFL7y0sW-AkkWVXXcTUURoM",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);