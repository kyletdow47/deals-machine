import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: list } = await supabase.from("lists").select("*").eq("id", id).single();
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: members } = await supabase
    .from("list_members")
    .select("added_at, leads(id, email, first_name, last_name, company, title), lead_id")
    .eq("list_id", id)
    .order("added_at", { ascending: false });

  const memberList = (members || []).map((m: any) => ({
    ...m.leads,
    added_at: m.added_at,
  }));

  return NextResponse.json({ ...list, members: memberList });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lead_ids } = await req.json();
  const rows = lead_ids.map((leadId: string) => ({ id: uuid(), list_id: id, lead_id: leadId }));
  const { data } = await supabase.from("list_members").upsert(rows, { onConflict: "list_id,lead_id", ignoreDuplicates: true }).select();
  return NextResponse.json({ added: data?.length || 0 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from("lists").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
