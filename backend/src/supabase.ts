import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

// Connection test (optional)
(async () => {
  const { error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) console.error('❌ Supabase connection failed:', error.message);
  else console.log('✅ Supabase connected successfully');
})();