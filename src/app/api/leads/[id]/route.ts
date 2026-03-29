import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: lead } = await supabase.from("leads").select("*, tags(tag)").eq("id", id).single();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...lead,
    tags: lead.tags?.map((t: any) => t.tag).join(",") || null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = ["first_name", "last_name", "email", "company", "title", "phone", "city", "country", "notes"];
  const updates: Record<string, any> = {};
  for (const f of fields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  updates.updated_at = new Date().toISOString();
  await supabase.from("leads").update(updates).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from("leads").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
