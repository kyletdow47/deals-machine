import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: sequence } = await supabase.from("sequences").select("*").eq("id", id).single();
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: steps } = await supabase.from("sequence_steps").select("*").eq("sequence_id", id).order("step_number");
  const { data: enrollments } = await supabase
    .from("sequence_enrollments")
    .select("*, leads(first_name, last_name, company, email)")
    .eq("sequence_id", id)
    .order("enrolled_at", { ascending: false });

  const enrollmentList = (enrollments || []).map((e: any) => ({
    ...e,
    first_name: e.leads?.first_name || "",
    last_name: e.leads?.last_name || "",
    company: e.leads?.company || "",
    email: e.leads?.email || "",
  }));

  return NextResponse.json({ ...sequence, steps: steps || [], enrollments: enrollmentList });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, description, steps } = await req.json();

  if (name !== undefined || description !== undefined) {
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    await supabase.from("sequences").update(updates).eq("id", id);
  }

  if (steps) {
    await supabase.from("sequence_steps").delete().eq("sequence_id", id);
    const rows = steps.map((step: any) => ({
      id: uuid(), sequence_id: id, step_number: step.step_number,
      delay_days: step.delay_days || 0, subject_template: step.subject_template || "",
      body_template: step.body_template || "",
    }));
    await supabase.from("sequence_steps").insert(rows);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from("sequences").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
