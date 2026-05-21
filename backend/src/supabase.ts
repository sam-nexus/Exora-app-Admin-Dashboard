import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection on startup
(async () => {
  try {
    // Perform a simple admin operation to confirm connectivity
    const { error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log('✅ Supabase connected successfully');
  } catch (err: any) {
    console.error('❌ Supabase connection failed:', err.message);
  }
})();