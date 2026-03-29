import { NextRequest, NextResponse } from "next/server";
import { db, uuid } from "@/lib/db";

// GET /api/sequences/:id — full sequence with steps + enrollments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sequence = db.prepare("SELECT * FROM sequences WHERE id = ?").get(id);
  if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const steps = db.prepare(
    "SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_number"
  ).all(id);

  const enrollments = db.prepare(`
    SELECT se.*, l.first_name, l.last_name, l.company, l.email
    FROM sequence_enrollments se
    JOIN leads l ON l.id = se.lead_id
    WHERE se.sequence_id = ?
    ORDER BY se.enrolled_at DESC
  `).all(id);

  return NextResponse.json({ ...sequence as any, steps, enrollments });
}

// PATCH /api/sequences/:id — update sequence + steps
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, description, steps } = await req.json();

  const tx = db.transaction(() => {
    if (name !== undefined || description !== undefined) {
      const updates: string[] = [];
      const vals: any[] = [];
      if (name !== undefined) { updates.push("name = ?"); vals.push(name); }
      if (description !== undefined) { updates.push("description = ?"); vals.push(description); }
      vals.push(id);
      db.prepare(`UPDATE sequences SET ${updates.join(", ")} WHERE id = ?`).run(...vals);
    }

    if (steps) {
      // Replace all steps
      db.prepare("DELETE FROM sequence_steps WHERE sequence_id = ?").run(id);
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

  return NextResponse.json({ ok: true });
}

// DELETE /api/sequences/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.prepare("DELETE FROM sequences WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
