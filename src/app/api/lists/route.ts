import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";

// GET /api/lists — all lists with member counts
export async function GET() {
  const lists = db.prepare(`
    SELECT l.*, COUNT(lm.id) as member_count
    FROM lists l
    LEFT JOIN list_members lm ON lm.list_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at ASC
  `).all();
  return NextResponse.json(lists);
}

// POST /api/lists — create a new list
export async function POST(req: NextRequest) {
  const { name, description, auto_tag } = await req.json();
  const id = uuid();
  db.prepare("INSERT INTO lists (id, name, description, auto_tag) VALUES (?, ?, ?, ?)").run(
    id, name, description || "", auto_tag || null
  );
  return NextResponse.json({ id });
}
