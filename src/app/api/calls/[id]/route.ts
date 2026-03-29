import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { outcome, notes } = await req.json();

  await supabase.from("call_queue").update({
    status: "completed", outcome, notes: notes || "", completed_at: new Date().toISOString(),
  }).eq("id", id);

  const { data: call } = await supabase.from("call_queue").select("lead_id").eq("id", id).single();
  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logActivity(call.lead_id, "call_completed", `Call completed — ${outcome}`, { outcome, notes: notes || "" });

  if (outcome === "positive") {
    const { data: lead } = await supabase.from("leads").select("pipeline_stage").eq("id", call.lead_id).single();
    if (lead?.pipeline_stage === "new") {
      await supabase.from("leads").update({ pipeline_stage: "discovery" }).eq("id", call.lead_id);
      await logActivity(call.lead_id, "stage_changed", "Moved to Discovery", { from: "new", to: "discovery" });
    }
  }

  const tagMap: Record<string, string> = {
    positive: "positive", negative: "negative", callback: "callback",
    "follow-up-email": "follow-up-email", completed: "completed",
  };

  const tag = tagMap[outcome];
  if (tag) {
    await supabase.from("tags").upsert({ id: uuid(), lead_id: call.lead_id, tag }, { onConflict: "lead_id,tag", ignoreDuplicates: true });
    await logActivity(call.lead_id, "tag_added", `Tagged as ${tag}`, { tag });

    const { data: list } = await supabase.from("lists").select("id, name").eq("auto_tag", tag).single();
    if (list) {
      await supabase.from("list_members").upsert({ id: uuid(), list_id: list.id, lead_id: call.lead_id }, { onConflict: "list_id,lead_id", ignoreDuplicates: true });
      await logActivity(call.lead_id, "list_added", `Added to "${list.name}" list`, { list_id: list.id });
    }
  }

  return NextResponse.json({ ok: true });
}
