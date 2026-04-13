import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env variables")
}

console.log("URL valid?", supabaseUrl?.startsWith("https"))
console.log("KEY length:", supabaseAnonKey?.length)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)