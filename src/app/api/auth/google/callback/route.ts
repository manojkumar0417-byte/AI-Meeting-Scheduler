import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam) return NextResponse.redirect(new URL(`/?oauth_error=${encodeURIComponent(errorParam)}`, origin));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const session = await getSession();

//   console.log("OAuth state check:", {
//   hasCode: Boolean(code),
//   hasState: Boolean(state),
//   hasSessionState: Boolean(session.oauthState),
//   stateMatches:
//     Boolean(state && session.oauthState) &&
//     state === session.oauthState,
// });

  if (!code || !state || !session.oauthState || state !== session.oauthState) {
    return NextResponse.json({ error: "OAuth state validation failed. Please try connecting again." }, { status: 400 });
  }

  try {
    const oauth = getOAuthClient();
    const { tokens } = await oauth.getToken(code);
    if (!tokens.access_token) throw new Error("Google did not return an access token.");
    session.googleTokens = {
      access_token: tokens.access_token ?? session.googleTokens?.access_token,
      refresh_token: tokens.refresh_token ?? session.googleTokens?.refresh_token,
      scope: tokens.scope ?? session.googleTokens?.scope,
      token_type: tokens.token_type ?? session.googleTokens?.token_type,
      expiry_date: tokens.expiry_date ?? session.googleTokens?.expiry_date,
      id_token: tokens.id_token ?? session.googleTokens?.id_token
    };
    session.oauthState = undefined;
    await session.save();
    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
