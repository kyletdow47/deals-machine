import { db, uuid } from "./db";

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

const insertStmt = db.prepare(
  "INSERT INTO activity_log (id, lead_id, action, description, metadata) VALUES (?, ?, ?, ?, ?)"
);

export function logActivity(
  leadId: string,
  action: ActionType,
  description: string,
  metadata: Record<string, any> = {}
) {
  insertStmt.run(uuid(), leadId, action, description, JSON.stringify(metadata));
}

export function getActivities(leadId: string, limit = 50) {
  return db
    .prepare(
      "SELECT * FROM activity_log WHERE lead_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(leadId, limit);
}

export function getRecentActivities(limit = 20) {
  return db
    .prepare(`
      SELECT al.*, l.first_name, l.last_name, l.company
      FROM activity_log al
      JOIN leads l ON l.id = al.lead_id
      ORDER BY al.created_at DESC LIMIT ?
    `)
    .all(limit);
}
