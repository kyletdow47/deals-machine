import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET /api/leads/:id/notes
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notes = db.prepare(
    "SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC"
  ).all(id);
  return NextResponse.json(notes);
}

// POST /api/leads/:id/notes — add a note
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty note" }, { status: 400 });

  const noteId = uuid();
  db.prepare("INSERT INTO lead_notes (id, lead_id, content) VALUES (?, ?, ?)").run(noteId, id, content);
  logActivity(id, "note_added", content.slice(0, 100), { note_id: noteId });

  return NextResponse.json({ id: noteId });
}
