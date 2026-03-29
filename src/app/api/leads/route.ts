import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";
import { logActivity } from "@/lib/activity";

// GET /api/leads — list all leads with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const source = searchParams.get("source") || "";
  const tag = searchParams.get("tag") || "";

  const stage = searchParams.get("stage") || "";

  let query = `
    SELECT l.*, GROUP_CONCAT(DISTINCT t.tag) as tags,
      (SELECT al.created_at FROM activity_log al WHERE al.lead_id = l.id ORDER BY al.created_at DESC LIMIT 1) as last_activity,
      (SELECT al.description FROM activity_log al WHERE al.lead_id = l.id ORDER BY al.created_at DESC LIMIT 1) as last_activity_desc
    FROM leads l
    LEFT JOIN tags t ON t.lead_id = l.id
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (search) {
    conditions.push(
      "(l.first_name LIKE ? OR l.last_name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)"
    );
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (source) {
    conditions.push("l.source = ?");
    params.push(source);
  }
  if (tag) {
    conditions.push("l.id IN (SELECT lead_id FROM tags WHERE tag = ?)");
    params.push(tag);
  }

  if (stage) {
    conditions.push("l.pipeline_stage = ?");
    params.push(stage);
  }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " GROUP BY l.id ORDER BY l.created_at DESC";

  const leads = db.prepare(query).all(...params);
  return NextResponse.json(leads);
}

// POST /api/leads — create a lead or bulk import
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Bulk import
  if (Array.isArray(body)) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO leads (id, email, first_name, last_name, company, title, phone, city, country, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction((leads: any[]) => {
      let count = 0;
      for (const l of leads) {
        const id = uuid();
        const result = insert.run(
          id, l.email, l.first_name || "", l.last_name || "",
          l.company || "", l.title || "", l.phone || "",
          l.city || "", l.country || "", l.source || "csv"
        );
        if (result.changes > 0) {
          logActivity(id, "lead_created", `Imported from CSV`, { source: "csv" });
          count++;
        }
      }
      return count;
    });
    const count = tx(body);
    return NextResponse.json({ imported: count });
  }

  // Single create
  const id = uuid();
  db.prepare(`
    INSERT INTO leads (id, email, first_name, last_name, company, title, phone, city, country, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.email, body.first_name || "", body.last_name || "",
    body.company || "", body.title || "", body.phone || "",
    body.city || "", body.country || "", body.source || "manual",
    body.notes || ""
  );

  logActivity(id, "lead_created", `Added manually`, { source: "manual" });

  return NextResponse.json({ id });
}
