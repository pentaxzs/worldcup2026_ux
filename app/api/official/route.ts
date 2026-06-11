import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VALID = ["czech", "mexico", "sa"];

export async function POST(req: Request) {
  try {
    const { pin, matchId, kr, opp, entered } = (await req.json()) || {};

    // 서버단 PIN 검증 (클라이언트가 아니라 여기서 실제로 막는다)
    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "invalid pin" }, { status: 401 });
    }

    // matchId 없으면 PIN 확인용(verify) 호출
    if (!matchId) return NextResponse.json({ ok: true, verified: true });

    if (!VALID.includes(matchId)) {
      return NextResponse.json({ error: "bad match" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("official_results")
      .upsert(
        {
          match_id: matchId,
          kr: Number(kr) || 0,
          opp: Number(opp) || 0,
          entered: !!entered,
        },
        { onConflict: "match_id" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
