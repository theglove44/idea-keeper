import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseInitializationError: string | null = 
    (!supabaseUrl || !supabaseAnonKey) 
    ? "Supabase URL and Anon Key not found. Please add them to your environment variables." 
    : null;

export const supabase: SupabaseClient | null = supabaseInitializationError 
    ? null 
    : createClient(supabaseUrl!, supabaseAnonKey!);
