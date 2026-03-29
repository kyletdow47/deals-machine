import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const { data } = await supabase
    .from("call_queue")
    .select("*, leads(first_name, last_name, company, title, phone, email, city), tags:leads(tags(tag))")
    .eq("status", status)
    .order("queued_at", { ascending: true });

  const items = (data || []).map((cq: any) => ({
    ...cq,
    first_name: cq.leads?.first_name || "",
    last_name: cq.leads?.last_name || "",
    company: cq.leads?.company || "",
    title: cq.leads?.title || "",
    phone: cq.leads?.phone || "",
    email: cq.leads?.email || "",
    city: cq.leads?.city || "",
    tags: cq.tags?.tags?.map((t: any) => t.tag).join(",") || null,
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { lead_ids } = await req.json();

  // Get existing pending entries
  const { data: existing } = await supabase
    .from("call_queue")
    .select("lead_id")
    .eq("status", "pending")
    .in("lead_id", lead_ids);

  const existingSet = new Set((existing || []).map((e: any) => e.lead_id));
  const newIds = lead_ids.filter((id: string) => !existingSet.has(id));

  if (newIds.length > 0) {
    const rows = newIds.map((leadId: string) => ({ id: uuid(), lead_id: leadId }));
    await supabase.from("call_queue").insert(rows);
  }

  return NextResponse.json({ added: newIds.length });
}
