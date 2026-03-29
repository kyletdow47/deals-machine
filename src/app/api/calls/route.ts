import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";

// GET /api/calls — get call queue
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const items = db.prepare(`
    SELECT cq.*, l.first_name, l.last_name, l.company, l.title, l.phone, l.email, l.city,
           GROUP_CONCAT(t.tag) as tags
    FROM call_queue cq
    JOIN leads l ON l.id = cq.lead_id
    LEFT JOIN tags t ON t.lead_id = l.id
    WHERE cq.status = ?
    GROUP BY cq.id
    ORDER BY cq.queued_at ASC
  `).all(status);

  return NextResponse.json(items);
}

// POST /api/calls — add leads to call queue
export async function POST(req: NextRequest) {
  const body = await req.json();
  const leadIds: string[] = body.lead_ids || [];

  const insert = db.prepare(
    "INSERT OR IGNORE INTO call_queue (id, lead_id) VALUES (?, ?)"
  );
  const tx = db.transaction((ids: string[]) => {
    let count = 0;
    for (const leadId of ids) {
      // Only add if not already in pending queue
      const existing = db.prepare(
        "SELECT id FROM call_queue WHERE lead_id = ? AND status = 'pending'"
      ).get(leadId);
      if (!existing) {
        insert.run(uuid(), leadId);
        count++;
      }
    }
    return count;
  });

  const added = tx(leadIds);
  return NextResponse.json({ added });
}
