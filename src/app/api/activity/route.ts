import { NextRequest, NextResponse } from "next/server";
import { getRecentActivities } from "@/lib/activity";

// GET /api/activity — recent activity across all leads
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const activities = getRecentActivities(limit);
  return NextResponse.json(activities);
}
