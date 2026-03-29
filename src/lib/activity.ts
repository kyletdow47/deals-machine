import { supabase, uuid } from "./db";

export type ActionType =
  | "lead_created"
  | "lead_updated"
  | "tag_added"
  | "tag_removed"
  | "call_queued"
  | "call_completed"
  | "note_added"
  | "note_updated"
  | "stage_changed"
  | "sequence_enrolled"
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "list_added"
  | "meeting_synced";

export async function logActivity(
  leadId: string,
  action: ActionType,
  description: string,
  metadata: Record<string, any> = {}
) {
  await supabase.from("activity_log").insert({
    id: uuid(),
    lead_id: leadId,
    action,
    description,
    metadata,
  });
}

export async function getActivities(leadId: string, limit = 50) {
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getRecentActivities(limit = 20) {
  const { data } = await supabase
    .from("activity_log")
    .select("*, leads(first_name, last_name, company)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((a: any) => ({
    ...a,
    first_name: a.leads?.first_name || "",
    last_name: a.leads?.last_name || "",
    company: a.leads?.company || "",
  }));
}
