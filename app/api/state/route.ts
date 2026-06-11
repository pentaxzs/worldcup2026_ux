import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pred, like, off] = await Promise.all([
      supabaseAdmin.from("predictions").select("*"),
      supabaseAdmin.from("likes").select("*"),
      supabaseAdmin.from("official_results").select("*"),
    ]);

    const official: Record<string, { kr: number; opp: number; entered: boolean }> = {};
    (off.data || []).forEach((r: any) => {
      official[r.match_id] = { kr: r.kr, opp: r.opp, entered: r.entered };
    });

    return NextResponse.json({
      predictions: pred.data || [],
      likes: like.data || [],
      official,
    });
  } catch (e) {
    return NextResponse.json({ predictions: [], likes: [], official: {} }, { status: 200 });
  }
}
