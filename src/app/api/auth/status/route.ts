import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ connected: Boolean(session.googleTokens?.access_token || session.googleTokens?.refresh_token) });
}
