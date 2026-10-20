import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  googleTokens?: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
    id_token?: string;
  };
  oauthState?: string;
};

const password = process.env.SESSION_PASSWORD;
if (!password || password.length < 32) {
  // Fail at request time with a clear message instead of silently using an unsafe secret.
  console.warn("SESSION_PASSWORD must be configured in .env.local with at least 32 characters.");
}

export const sessionOptions: SessionOptions = {
  cookieName: "meeting_scheduler_session",
  password: password && password.length >= 32 ? password : "development-only-password-change-me-123456",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  }
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
