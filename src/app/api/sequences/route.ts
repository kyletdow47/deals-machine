import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";

export async function GET() {
  const { data } = await supabase
    .from("sequences")
    .select("*, sequence_steps(id), sequence_enrollments(id, status)")
    .order("created_at", { ascending: false });

  const result = (data || []).map((s: any) => ({
    ...s,
    step_count: s.sequence_steps?.length || 0,
    enrolled_count: s.sequence_enrollments?.length || 0,
    active_count: s.sequence_enrollments?.filter((e: any) => e.status === "active").length || 0,
    sequence_steps: undefined,
    sequence_enrollments: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { name, description, steps } = await req.json();
  const id = uuid();

  await supabase.from("sequences").insert({ id, name, description: description || "" });

  if (steps?.length) {
    const rows = steps.map((step: any) => ({
      id: uuid(), sequence_id: id, step_number: step.step_number,
      delay_days: step.delay_days || 0, subject_template: step.subject_template || "",
      body_template: step.body_template || "",
    }));
    await supabase.from("sequence_steps").insert(rows);
  }

  return NextResponse.json({ id });
}
