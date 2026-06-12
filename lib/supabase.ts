// Supabase REST API 직접 호출 헬퍼
// supabase-js가 Next.js 환경에서 캐싱 이슈가 있어 raw fetch 사용

const getUrl = () => process.env.SUPABASE_URL!;
const getKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  const key = getKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export const supabase = {
  async select(table: string) {
    const res = await fetch(`${getUrl()}/rest/v1/${table}?select=*`, {
      headers: headers(),
      cache: "no-store",
    });
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], error: res.ok ? null : data };
  },

  async upsert(table: string, body: any, onConflict: string) {
    const res = await fetch(
      `${getUrl()}/rest/v1/${table}?on_conflict=${onConflict}`,
      {
        method: "POST",
        headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    const data = await res.json();
    return { data, error: res.ok ? null : data };
  },

  async update(table: string, body: any, eqCol: string, eqVal: string) {
    const res = await fetch(
      `${getUrl()}/rest/v1/${table}?${eqCol}=eq.${encodeURIComponent(eqVal)}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    if (res.status === 204) return { data: null, error: null };
    const data = await res.json();
    return { data, error: res.ok ? null : data };
  },

  async delete(table: string, eqCol: string, eqVal: string) {
    const res = await fetch(
      `${getUrl()}/rest/v1/${table}?${eqCol}=eq.${encodeURIComponent(eqVal)}`,
      {
        method: "DELETE",
        headers: headers(),
        cache: "no-store",
      }
    );
    if (res.status === 204) return { error: null };
    const data = await res.json();
    return { error: res.ok ? null : data };
  },
};
