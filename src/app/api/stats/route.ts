import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats — dashboard stats
export async function GET() {
  const totalLeads = (db.prepare("SELECT COUNT(*) as c FROM leads").get() as any).c;
  const callsPending = (db.prepare("SELECT COUNT(*) as c FROM call_queue WHERE status = 'pending'").get() as any).c;
  const callsToday = (db.prepare("SELECT COUNT(*) as c FROM call_queue WHERE status = 'completed' AND completed_at >= date('now')").get() as any).c;
  const activeSequences = (db.prepare("SELECT COUNT(*) as c FROM sequence_enrollments WHERE status = 'active'").get() as any).c;

  const pipeline = db.prepare(`
    SELECT pipeline_stage, COUNT(*) as count
    FROM leads
    GROUP BY pipeline_stage
  `).all();

  const pipelineMap: Record<string, number> = {};
  for (const row of pipeline as any[]) {
    pipelineMap[row.pipeline_stage] = row.count;
  }

  return NextResponse.json({
    total_leads: totalLeads,
    calls_pending: callsPending,
    calls_today: callsToday,
    active_sequences: activeSequences,
    pipeline: pipelineMap,
  });
}
