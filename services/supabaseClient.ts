import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseHost = (() => {
    try {
        return supabaseUrl ? new URL(supabaseUrl).host : null;
    } catch {
        return null;
    }
})();

export const supabaseInitializationError: string | null =
    (!supabaseUrl || !supabaseAnonKey)
        ? 'Supabase URL (`VITE_SUPABASE_URL`) and Anon Key (`VITE_SUPABASE_ANON_KEY`) are required.'
        : null;

export const supabase: SupabaseClient | null = supabaseInitializationError
    ? null
    : createClient(supabaseUrl!, supabaseAnonKey!);

export const formatSupabaseError = (
    error: unknown,
    fallback = 'Unexpected Supabase error.'
): string => {
    const message =
        error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message ?? '')
            : '';

    if (/failed to fetch|fetch failed/i.test(message)) {
        const hostText = supabaseHost ? ` (${supabaseHost})` : '';
        return `Cannot reach Supabase${hostText}. Check VITE_SUPABASE_URL in .env.local and make sure the Supabase project is active and reachable.`;
    }

    return message || fallback;
};
