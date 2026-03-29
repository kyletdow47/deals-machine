import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tag } = await req.json();

  await supabase.from("tags").upsert({ id: uuid(), lead_id: id, tag }, { onConflict: "lead_id,tag", ignoreDuplicates: true });
  await logActivity(id, "tag_added", `Tagged as ${tag}`, { tag });

  const { data: list } = await supabase.from("lists").select("id, name").eq("auto_tag", tag).single();
  if (list) {
    await supabase.from("list_members").upsert({ id: uuid(), list_id: list.id, lead_id: id }, { onConflict: "list_id,lead_id", ignoreDuplicates: true });
    await logActivity(id, "list_added", `Added to "${list.name}" list`, { list_id: list.id });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tag } = await req.json();
  await supabase.from("tags").delete().eq("lead_id", id).eq("tag", tag);
  await logActivity(id, "tag_removed", `Removed tag ${tag}`, { tag });
  return NextResponse.json({ ok: true });
}
