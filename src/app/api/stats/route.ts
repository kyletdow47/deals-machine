import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  const { count: totalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true });
  const { count: callsPending } = await supabase.from("call_queue").select("*", { count: "exact", head: true }).eq("status", "pending");

  const today = new Date().toISOString().split("T")[0];
  const { count: callsToday } = await supabase.from("call_queue").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", today);
  const { count: activeSequences } = await supabase.from("sequence_enrollments").select("*", { count: "exact", head: true }).eq("status", "active");

  const { data: leads } = await supabase.from("leads").select("pipeline_stage");
  const pipelineMap: Record<string, number> = {};
  for (const l of leads || []) {
    pipelineMap[l.pipeline_stage] = (pipelineMap[l.pipeline_stage] || 0) + 1;
  }

  return NextResponse.json({
    total_leads: totalLeads || 0,
    calls_pending: callsPending || 0,
    calls_today: callsToday || 0,
    active_sequences: activeSequences || 0,
    pipeline: pipelineMap,
  });
}
