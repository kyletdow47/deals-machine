import { NextRequest, NextResponse } from "next/server";
import { getRecentActivities } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const activities = await getRecentActivities(limit);
  return NextResponse.json(activities);
}
