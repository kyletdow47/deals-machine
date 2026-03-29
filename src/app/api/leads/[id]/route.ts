import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/leads/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = db.prepare(`
    SELECT l.*, GROUP_CONCAT(t.tag) as tags
    FROM leads l LEFT JOIN tags t ON t.lead_id = l.id
    WHERE l.id = ? GROUP BY l.id
  `).get(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

// PATCH /api/leads/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = ["first_name", "last_name", "email", "company", "title", "phone", "city", "country", "notes"];
  const updates: string[] = [];
  const values: any[] = [];

  for (const f of fields) {
    if (f in body) {
      updates.push(`${f} = ?`);
      values.push(body[f]);
    }
  }
  if (!updates.length) return NextResponse.json({ error: "No fields" }, { status: 400 });

  updates.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return NextResponse.json({ ok: true });
}

// DELETE /api/leads/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
