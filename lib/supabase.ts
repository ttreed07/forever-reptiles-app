import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfjawodwtmmygetggdoe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uo7tnsZ0nrmjN-6xbsLSdg_nyzxgv-o';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);