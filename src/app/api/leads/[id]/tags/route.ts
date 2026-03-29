import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// POST /api/leads/:id/tags — add a tag + auto-add to matching list
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tag } = await req.json();

  db.prepare("INSERT OR IGNORE INTO tags (id, lead_id, tag) VALUES (?, ?, ?)").run(uuid(), id, tag);
  logActivity(id, "tag_added", `Tagged as ${tag}`, { tag });

  // Auto-add to list with matching auto_tag
  const list = db.prepare("SELECT id, name FROM lists WHERE auto_tag = ?").get(tag) as any;
  if (list) {
    db.prepare("INSERT OR IGNORE INTO list_members (id, list_id, lead_id) VALUES (?, ?, ?)").run(
      uuid(), list.id, id
    );
    logActivity(id, "list_added", `Added to "${list.name}" list`, { list_id: list.id });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/leads/:id/tags — remove a tag
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tag } = await req.json();
  db.prepare("DELETE FROM tags WHERE lead_id = ? AND tag = ?").run(id, tag);
  logActivity(id, "tag_removed", `Removed tag ${tag}`, { tag });
  return NextResponse.json({ ok: true });
}
