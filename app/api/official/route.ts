import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VALID = ["czech", "mexico", "sa"];

export async function POST(req: Request) {
  try {
    const { pin, matchId, kr, opp, entered } = (await req.json()) || {};

    if (!pin || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "invalid pin" }, { status: 401 });
    }

    if (!matchId) return NextResponse.json({ ok: true, verified: true });

    if (!VALID.includes(matchId)) {
      return NextResponse.json({ error: "bad match" }, { status: 400 });
    }

    const { error } = await supabase.upsert(
      "official_results",
      {
        match_id: matchId,
        kr: Number(kr) || 0,
        opp: Number(opp) || 0,
        entered: !!entered,
      },
      "match_id"
    );
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
