import { createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
// Get these from your Supabase project settings:
// Project URL and anon key from: Settings > API
const supabaseUrl = 'https://bkamgnuuxesljmtcfyuo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYW1nbnV1eGVzbGptdGNmeXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODc1NzcsImV4cCI6MjA4MDA2MzU3N30.BCJRzI2fFgC2b5Q8frkqYINliVl640F5hsPOIka8Q3k'; // TODO: Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
