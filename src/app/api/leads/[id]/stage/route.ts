import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// PATCH /api/leads/:id/stage — change pipeline stage
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stage } = await req.json();

  const lead = db.prepare("SELECT pipeline_stage FROM leads WHERE id = ?").get(id) as any;
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const oldStage = lead.pipeline_stage;
  db.prepare("UPDATE leads SET pipeline_stage = ?, updated_at = datetime('now') WHERE id = ?").run(stage, id);
  logActivity(id, "stage_changed", `Moved from ${oldStage} to ${stage}`, { from: oldStage, to: stage });

  return NextResponse.json({ ok: true });
}
