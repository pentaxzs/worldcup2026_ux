import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { predUserId, likerId, liked } = (await req.json()) || {};
    if (!predUserId || !likerId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    if (liked) {
      const { error } = await supabaseAdmin
        .from("likes")
        .upsert(
          { pred_user_id: predUserId, liker_id: likerId },
          { onConflict: "pred_user_id,liker_id" }
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin
        .from("likes")
        .delete()
        .eq("pred_user_id", predUserId)
        .eq("liker_id", likerId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
