import "server-only";
import { google } from "googleapis";
import { getSession } from "@/lib/session";

export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getCalendarClient() {
  const session = await getSession();
  if (!session.googleTokens) {
    throw new Error("Google Calendar is not connected. Click Connect Google Calendar first.");
  }

  const auth = getOAuthClient();
  auth.setCredentials(session.googleTokens);

  // Persist refreshed access tokens back into the encrypted session cookie.
  auth.on("tokens", (tokens) => {
    session.googleTokens = { ...session.googleTokens, ...tokens };
    void session.save();
  });

  return google.calendar({ version: "v3", auth });
}

export function requireEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}
