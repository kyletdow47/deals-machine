import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stage } = await req.json();

  const { data: lead } = await supabase.from("leads").select("pipeline_stage").eq("id", id).single();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldStage = lead.pipeline_stage;
  await supabase.from("leads").update({ pipeline_stage: stage, updated_at: new Date().toISOString() }).eq("id", id);
  await logActivity(id, "stage_changed", `Moved from ${oldStage} to ${stage}`, { from: oldStage, to: stage });

  return NextResponse.json({ ok: true });
}
