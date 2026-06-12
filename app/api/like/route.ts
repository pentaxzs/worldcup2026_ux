import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { predUserId, likerId, liked } = (await req.json()) || {};
    if (!predUserId || !likerId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    if (liked) {
      const { error } = await supabase.upsert(
        "likes",
        { pred_user_id: predUserId, liker_id: likerId },
        "pred_user_id,liker_id"
      );
      if (error) return NextResponse.json({ error }, { status: 500 });
    } else {
      // 복합 키 삭제는 raw fetch 사용
      const url = process.env.SUPABASE_URL!;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      await fetch(
        `${url}/rest/v1/likes?pred_user_id=eq.${encodeURIComponent(predUserId)}&liker_id=eq.${encodeURIComponent(likerId)}`,
        {
          method: "DELETE",
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: "no-store",
        }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
