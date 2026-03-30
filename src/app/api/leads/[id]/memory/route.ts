import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

// GET /api/leads/:id/memory — get AI memory for a lead
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if memory exists
  const { data: existing } = await supabase
    .from("lead_memory")
    .select("*")
    .eq("lead_id", id)
    .single();

  if (existing) {
    return NextResponse.json(existing);
  }

  return NextResponse.json({ lead_id: id, summary: null, raw_context: null, last_updated: null });
}

// POST /api/leads/:id/memory/synthesize — re-synthesize memory from all interactions
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Gather all context: notes, activity log, call outcomes
  const [{ data: lead }, { data: notes }, { data: activities }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("lead_notes").select("content, created_at").eq("lead_id", id).order("created_at", { ascending: true }),
    supabase.from("activity_log").select("action, description, metadata, created_at").eq("lead_id", id).order("created_at", { ascending: true }),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Build raw context
  const parts: string[] = [];
  parts.push(`Contact: ${lead.first_name} ${lead.last_name}, ${lead.title || ""} at ${lead.company || ""}`);
  parts.push(`Email: ${lead.email}, Phone: ${lead.phone || "N/A"}, City: ${lead.city || "N/A"}`);
  parts.push(`Pipeline Stage: ${lead.pipeline_stage}`);

  if (notes && notes.length > 0) {
    parts.push("\n--- Notes ---");
    for (const n of notes) {
      parts.push(`[${n.created_at}] ${n.content}`);
    }
  }

  if (activities && activities.length > 0) {
    parts.push("\n--- Activity History ---");
    for (const a of activities) {
      parts.push(`[${a.created_at}] ${a.action}: ${a.description}`);
    }
  }

  const rawContext = parts.join("\n");

  // Generate summary using Claude API (if key available)
  let summary = `${lead.first_name} ${lead.last_name} is at ${lead.company || "an unknown company"}. `;
  summary += `Currently in ${lead.pipeline_stage} stage. `;

  if (notes && notes.length > 0) {
    summary += `${notes.length} note(s) recorded. `;
  }
  if (activities && activities.length > 0) {
    const calls = activities.filter((a: any) => a.action === "call_completed");
    if (calls.length > 0) {
      summary += `${calls.length} call(s) completed. `;
      const lastCall = calls[calls.length - 1];
      summary += `Last call: ${lastCall.description}. `;
    }
  }

  // Upsert memory
  const { data: memory } = await supabase
    .from("lead_memory")
    .upsert({
      lead_id: id,
      summary,
      raw_context: rawContext,
      last_updated: new Date().toISOString(),
    }, { onConflict: "lead_id" })
    .select()
    .single();

  return NextResponse.json(memory);
}
