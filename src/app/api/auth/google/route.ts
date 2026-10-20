import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getOAuthClient, CALENDAR_SCOPE } from "@/lib/google";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    const state = randomBytes(24).toString("hex");
    session.oauthState = state;
    await session.save();

    const url = getOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [CALENDAR_SCOPE, "openid", "email", "profile"],
      state
    });
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
