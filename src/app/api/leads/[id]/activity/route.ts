import { NextRequest, NextResponse } from "next/server";
import { getActivities } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activities = await getActivities(id, 100);
  return NextResponse.json(activities);
}
