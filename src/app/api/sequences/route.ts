import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";

// GET /api/sequences — all sequences
export async function GET() {
  const sequences = db.prepare(`
    SELECT s.*,
      COUNT(DISTINCT ss.id) as step_count,
      COUNT(DISTINCT se.id) as enrolled_count,
      SUM(CASE WHEN se.status = 'active' THEN 1 ELSE 0 END) as active_count
    FROM sequences s
    LEFT JOIN sequence_steps ss ON ss.sequence_id = s.id
    LEFT JOIN sequence_enrollments se ON se.sequence_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all();
  return NextResponse.json(sequences);
}

// POST /api/sequences — create sequence with steps
export async function POST(req: NextRequest) {
  const { name, description, steps } = await req.json();
  const id = uuid();

  const tx = db.transaction(() => {
    db.prepare("INSERT INTO sequences (id, name, description) VALUES (?, ?, ?)").run(
      id, name, description || ""
    );

    if (steps && steps.length) {
      const insertStep = db.prepare(`
        INSERT INTO sequence_steps (id, sequence_id, step_number, delay_days, subject_template, body_template)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const step of steps) {
        insertStep.run(
          uuid(), id, step.step_number, step.delay_days || 0,
          step.subject_template || "", step.body_template || ""
        );
      }
    }
  });
  tx();

  return NextResponse.json({ id });
}
