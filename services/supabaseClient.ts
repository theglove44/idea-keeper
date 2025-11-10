import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseInitializationError: string | null =
    (!supabaseUrl || !supabaseAnonKey)
        ? 'Supabase URL (`VITE_SUPABASE_URL`) and Anon Key (`VITE_SUPABASE_ANON_KEY`) are required.'
        : null;

export const supabase: SupabaseClient | null = supabaseInitializationError
    ? null
    : createClient(supabaseUrl!, supabaseAnonKey!);
