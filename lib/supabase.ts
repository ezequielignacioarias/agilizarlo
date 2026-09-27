import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://damcoppuprzseticxlhl.supabase.co';
const supabaseKey = 'sb_publishable_LxXvw-HAVd1GrszXCmfNfA_hQ7BjhKk';

export const supabase = createClient(supabaseUrl, supabaseKey);