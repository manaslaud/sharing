import { NextRequest, NextResponse } from "next/server";
import { dispatchDueNotifications } from "@/lib/push";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const query = request.nextUrl.searchParams.get("secret");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : query;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dispatchDueNotifications();
  return NextResponse.json({ ok: true, ...result });
}
