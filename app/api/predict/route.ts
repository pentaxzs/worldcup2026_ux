import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, nickname, team, scores, comment } = body || {};
    if (!userId || !nickname || !team || !scores) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const { error } = await supabase.upsert(
      "predictions",
      { user_id: userId, nickname, team, scores, comment: (comment || "").slice(0, 15) },
      "user_id"
    );
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 운영자: 예측 삭제 (PIN 인증 필수)
export async function DELETE(req: Request) {
  try {
    const { pin, userId } = (await req.json()) || {};
    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "invalid pin" }, { status: 401 });
    }
    if (!userId) {
      return NextResponse.json({ error: "missing userId" }, { status: 400 });
    }
    // 관련 좋아요도 함께 삭제
    await supabase.delete("likes", "pred_user_id", userId);
    await supabase.delete("likes", "liker_id", userId);
    const { error } = await supabase.delete("predictions", "user_id", userId);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 운영자: 예측 수정 (PIN 인증 필수)
export async function PATCH(req: Request) {
  try {
    const { pin, userId, nickname, team, scores, comment } = (await req.json()) || {};
    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "invalid pin" }, { status: 401 });
    }
    if (!userId) {
      return NextResponse.json({ error: "missing userId" }, { status: 400 });
    }
    const updates: any = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (team !== undefined) updates.team = team;
    if (scores !== undefined) updates.scores = scores;
    if (comment !== undefined) updates.comment = comment;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }
    const { error } = await supabase.update("predictions", updates, "user_id", userId);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
