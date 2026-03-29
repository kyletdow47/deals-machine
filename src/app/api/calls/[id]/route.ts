import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// PATCH /api/calls/:id — complete a call with outcome
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { outcome, notes } = await req.json();

  // Update call queue entry
  db.prepare(`
    UPDATE call_queue SET status = 'completed', outcome = ?, notes = ?, completed_at = datetime('now')
    WHERE id = ?
  `).run(outcome, notes || "", id);

  // Get the lead_id
  const call = db.prepare("SELECT lead_id FROM call_queue WHERE id = ?").get(id) as any;
  if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log the call
  logActivity(call.lead_id, "call_completed", `Call completed — ${outcome}`, { outcome, notes: notes || "" });

  // Update pipeline stage based on outcome
  if (outcome === "positive") {
    db.prepare("UPDATE leads SET pipeline_stage = 'discovery' WHERE id = ? AND pipeline_stage = 'new'").run(call.lead_id);
    logActivity(call.lead_id, "stage_changed", "Moved to Discovery", { from: "new", to: "discovery" });
  }

  // Tag the lead based on outcome
  const tagMap: Record<string, string> = {
    positive: "positive",
    negative: "negative",
    callback: "callback",
    "follow-up-email": "follow-up-email",
    completed: "completed",
  };

  const tag = tagMap[outcome];
  if (tag) {
    db.prepare("INSERT OR IGNORE INTO tags (id, lead_id, tag) VALUES (?, ?, ?)").run(
      uuid(), call.lead_id, tag
    );
    logActivity(call.lead_id, "tag_added", `Tagged as ${tag}`, { tag });

    // Auto-add to matching list
    const list = db.prepare("SELECT id, name FROM lists WHERE auto_tag = ?").get(tag) as any;
    if (list) {
      db.prepare("INSERT OR IGNORE INTO list_members (id, list_id, lead_id) VALUES (?, ?, ?)").run(
        uuid(), list.id, call.lead_id
      );
      logActivity(call.lead_id, "list_added", `Added to "${list.name}" list`, { list_id: list.id });
    }
  }

  return NextResponse.json({ ok: true });
}
