import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sequenceId } = await params;
  const { list_id } = await req.json();

  const { data: seq } = await supabase.from("sequences").select("name").eq("id", sequenceId).single();
  const { data: members } = await supabase.from("list_members").select("lead_id").eq("list_id", list_id);

  let enrolled = 0;
  for (const m of members || []) {
    const { error } = await supabase.from("sequence_enrollments").insert({
      id: uuid(), sequence_id: sequenceId, lead_id: m.lead_id, list_id,
    });
    if (!error) {
      await logActivity(m.lead_id, "sequence_enrolled", `Enrolled in "${seq?.name || "sequence"}"`, { sequence_id: sequenceId });
      enrolled++;
    }
  }

  return NextResponse.json({ enrolled });
}
