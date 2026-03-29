import { NextRequest, NextResponse } from "next/server";
import { supabase, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET /api/leads
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const stage = searchParams.get("stage") || "";
  const tag = searchParams.get("tag") || "";

  let query = supabase
    .from("leads")
    .select("*, tags(tag)")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (stage) {
    query = query.eq("pipeline_stage", stage);
  }

  const { data } = await query;

  let leads = (data || []).map((l: any) => ({
    ...l,
    tags: l.tags?.map((t: any) => t.tag).join(",") || null,
  }));

  // Filter by tag if specified
  if (tag) {
    leads = leads.filter((l: any) => l.tags?.includes(tag));
  }

  // Get last activity for each lead
  const leadIds = leads.map((l: any) => l.id);
  if (leadIds.length > 0) {
    const { data: activities } = await supabase
      .from("activity_log")
      .select("lead_id, description, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    const lastActivity: Record<string, any> = {};
    for (const a of activities || []) {
      if (!lastActivity[a.lead_id]) lastActivity[a.lead_id] = a;
    }

    leads = leads.map((l: any) => ({
      ...l,
      last_activity: lastActivity[l.id]?.created_at || null,
      last_activity_desc: lastActivity[l.id]?.description || null,
    }));
  }

  return NextResponse.json(leads);
}

// POST /api/leads
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body)) {
    const rows = body.map((l: any) => ({
      id: uuid(),
      email: l.email,
      first_name: l.first_name || "",
      last_name: l.last_name || "",
      company: l.company || "",
      title: l.title || "",
      phone: l.phone || "",
      city: l.city || "",
      country: l.country || "",
      source: l.source || "csv",
    }));

    const { data } = await supabase.from("leads").upsert(rows, { onConflict: "email", ignoreDuplicates: true }).select();
    const count = data?.length || 0;

    for (const row of data || []) {
      await logActivity(row.id, "lead_created", "Imported from CSV", { source: "csv" });
    }

    return NextResponse.json({ imported: count });
  }

  const id = uuid();
  await supabase.from("leads").insert({
    id,
    email: body.email,
    first_name: body.first_name || "",
    last_name: body.last_name || "",
    company: body.company || "",
    title: body.title || "",
    phone: body.phone || "",
    city: body.city || "",
    country: body.country || "",
    source: body.source || "manual",
    notes: body.notes || "",
  });

  await logActivity(id, "lead_created", "Added manually", { source: "manual" });

  return NextResponse.json({ id });
}
