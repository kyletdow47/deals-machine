import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// POST /api/sequences/:id/enroll — enroll a list into a sequence
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequenceId } = await params;
  const { list_id } = await req.json();

  const seq = db.prepare("SELECT name FROM sequences WHERE id = ?").get(sequenceId) as any;
  const members = db.prepare(
    "SELECT lead_id FROM list_members WHERE list_id = ?"
  ).all(list_id) as any[];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO sequence_enrollments (id, sequence_id, lead_id, list_id)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    let count = 0;
    for (const m of members) {
      const r = insert.run(uuid(), sequenceId, m.lead_id, list_id);
      if (r.changes > 0) {
        logActivity(m.lead_id, "sequence_enrolled", `Enrolled in "${seq?.name || "sequence"}"`, { sequence_id: sequenceId });
        count++;
      }
    }
    return count;
  });

  const enrolled = tx();
  return NextResponse.json({ enrolled });
}
