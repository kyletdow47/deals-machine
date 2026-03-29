import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabase.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty note" }, { status: 400 });

  const noteId = uuid();
  await supabase.from("lead_notes").insert({ id: noteId, lead_id: id, content });
  await logActivity(id, "note_added", content.slice(0, 100), { note_id: noteId });

  return NextResponse.json({ id: noteId });
}
