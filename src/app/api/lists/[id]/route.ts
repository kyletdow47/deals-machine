import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";

// GET /api/lists/:id — list details + members
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = db.prepare(`
    SELECT l.*, lm.added_at, GROUP_CONCAT(t.tag) as tags
    FROM list_members lm
    JOIN leads l ON l.id = lm.lead_id
    LEFT JOIN tags t ON t.lead_id = l.id
    WHERE lm.list_id = ?
    GROUP BY l.id
    ORDER BY lm.added_at DESC
  `).all(id);

  return NextResponse.json({ ...list as any, members });
}

// POST /api/lists/:id — add leads to list
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead_ids } = await req.json();

  const insert = db.prepare(
    "INSERT OR IGNORE INTO list_members (id, list_id, lead_id) VALUES (?, ?, ?)"
  );
  const tx = db.transaction((ids: string[]) => {
    let count = 0;
    for (const leadId of ids) {
      const r = insert.run(uuid(), id, leadId);
      if (r.changes > 0) count++;
    }
    return count;
  });

  const added = tx(lead_ids);
  return NextResponse.json({ added });
}

// DELETE /api/lists/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("DELETE FROM lists WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
