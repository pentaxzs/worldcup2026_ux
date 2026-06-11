import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, nickname, team, scores } = body || {};
    if (!userId || !nickname || !team || !scores) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    // 1인 1예측: user_id 충돌 시 갱신. (제출 잠금은 클라이언트에서 관리)
    const { error } = await supabaseAdmin
      .from("predictions")
      .upsert(
        { user_id: userId, nickname, team, scores },
        { onConflict: "user_id" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
