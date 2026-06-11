import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// 서버 전용 클라이언트. service_role 키는 절대 클라이언트에 노출하지 말 것.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
