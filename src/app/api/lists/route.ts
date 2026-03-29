import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";

export async function GET() {
  const { data: lists } = await supabase.from("lists").select("*, list_members(id)").order("created_at", { ascending: true });
  const result = (lists || []).map((l: any) => ({
    ...l,
    member_count: l.list_members?.length || 0,
    list_members: undefined,
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { name, description, auto_tag } = await req.json();
  const id = uuid();
  await supabase.from("lists").insert({ id, name, description: description || "", auto_tag: auto_tag || null });
  return NextResponse.json({ id });
}
